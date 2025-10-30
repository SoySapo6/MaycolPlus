import fs from 'fs'
import path from 'path'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const dbPath = './database/cajas.json'

// Inicializar database si no existe
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '[]', 'utf-8')
}

// Leer database
function leerDB() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
}

// Guardar database
function guardarDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
}

// Descargar multimedia
async function descargarMedia(message) {
    const stream = await downloadContentFromMessage(message, message.type)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
}

// ====== COMANDO 1: GUARDAR ======
let handlerGuardar = async (m, { conn, args, text }) => {
    let numero = m.sender.split('@')[0]
    let carpeta = `./storage/videos/${numero}`
    
    if (!fs.existsSync(carpeta)) {
        fs.mkdirSync(carpeta, { recursive: true })
    }

    if (!args[0]) {
        return m.reply('⚠️ *Uso correcto:*\n\n.guardar [nombre]\n\n*Responde* a un texto, imagen, video, audio o documento que desees guardar.')
    }

    let nombre = args.join(' ')
    let db = leerDB()
    
    // Verificar si ya existe ese nombre
    if (db.find(item => item.numero === numero && item.nombre === nombre)) {
        return m.reply(`⚠️ Ya existe un archivo con el nombre "${nombre}".\nElige otro nombre.`)
    }

    let tipo = 'texto'
    let contenido = ''
    let extension = ''

    // Si responde a un mensaje
    if (m.quoted) {
        let quoted = m.quoted
        
        if (quoted.text) {
            tipo = 'texto'
            contenido = quoted.text
        } else if (quoted.imageMessage) {
            tipo = 'imagen'
            extension = '.jpg'
            let buffer = await descargarMedia(quoted.imageMessage)
            let archivo = path.join(carpeta, `${nombre}${extension}`)
            fs.writeFileSync(archivo, buffer)
            contenido = archivo
        } else if (quoted.videoMessage) {
            tipo = 'video'
            extension = '.mp4'
            let buffer = await descargarMedia(quoted.videoMessage)
            let archivo = path.join(carpeta, `${nombre}${extension}`)
            fs.writeFileSync(archivo, buffer)
            contenido = archivo
        } else if (quoted.audioMessage) {
            tipo = 'audio'
            extension = '.mp3'
            let buffer = await descargarMedia(quoted.audioMessage)
            let archivo = path.join(carpeta, `${nombre}${extension}`)
            fs.writeFileSync(archivo, buffer)
            contenido = archivo
        } else if (quoted.documentMessage) {
            tipo = 'documento'
            let mime = quoted.documentMessage.mimetype || ''
            extension = mime.includes('pdf') ? '.pdf' : mime.includes('zip') ? '.zip' : '.file'
            let buffer = await descargarMedia(quoted.documentMessage)
            let archivo = path.join(carpeta, `${nombre}${extension}`)
            fs.writeFileSync(archivo, buffer)
            contenido = archivo
        } else {
            return m.reply('⚠️ No se puede guardar ese tipo de contenido.')
        }
    } else {
        return m.reply('⚠️ Debes *responder* a un mensaje para guardarlo.')
    }

    // Guardar en database
    db.push({
        numero,
        nombre,
        tipo,
        contenido,
        fecha: new Date().toISOString()
    })
    
    guardarDB(db)
    
    m.reply(`✅ *Guardado exitoso*\n\n📦 Nombre: ${nombre}\n📁 Tipo: ${tipo}\n🔒 Usa .sacar para recuperarlo`)
}

handlerGuardar.help = ['guardar']
handlerGuardar.tags = ['cajafuerte']
handlerGuardar.command = ['guardar', 'save']

// ====== COMANDO 2: SACAR ======
let handlerSacar = async (m, { conn, args, text }) => {
    let numero = m.sender.split('@')[0]
    let db = leerDB()
    
    // Buscar si tiene contraseña configurada
    let usuarioConfig = db.find(item => item.numero === numero && item.tipo === 'config')
    
    if (!args[0]) {
        return m.reply(`⚠️ *Uso correcto:*\n\n.sacar [nombre] ${usuarioConfig ? '[contraseña]' : ''}\n\nEjemplo:\n.sacar foto123${usuarioConfig ? ' micontraseña' : ''}`)
    }

    let nombre = args[0]
    let contraseña = args[1] || ''

    // Verificar contraseña si está configurada
    if (usuarioConfig) {
        if (!contraseña) {
            return m.reply('🔐 *Contraseña requerida*\n\n.sacar [nombre] [contraseña]')
        }
        if (contraseña !== usuarioConfig.contraseña) {
            return m.reply('❌ Contraseña incorrecta.')
        }
    }

    // Buscar archivo
    let archivo = db.find(item => item.numero === numero && item.nombre === nombre && item.tipo !== 'config')
    
    if (!archivo) {
        return m.reply(`❌ No se encontró ningún archivo con el nombre "${nombre}".`)
    }

    // Eliminar de database
    db = db.filter(item => !(item.numero === numero && item.nombre === nombre && item.tipo !== 'config'))
    guardarDB(db)

    // Enviar contenido
    if (archivo.tipo === 'texto') {
        await m.reply(`📄 *${nombre}*\n\n${archivo.contenido}`)
    } else if (archivo.tipo === 'imagen') {
        await conn.sendFile(m.chat, archivo.contenido, `${nombre}.jpg`, `📷 *${nombre}*`, m)
        fs.unlinkSync(archivo.contenido)
    } else if (archivo.tipo === 'video') {
        await conn.sendFile(m.chat, archivo.contenido, `${nombre}.mp4`, `🎥 *${nombre}*`, m)
        fs.unlinkSync(archivo.contenido)
    } else if (archivo.tipo === 'audio') {
        await conn.sendFile(m.chat, archivo.contenido, `${nombre}.mp3`, '', m, false, { mimetype: 'audio/mp4' })
        fs.unlinkSync(archivo.contenido)
    } else if (archivo.tipo === 'documento') {
        await conn.sendFile(m.chat, archivo.contenido, nombre, `📎 *${nombre}*`, m)
        fs.unlinkSync(archivo.contenido)
    }

    m.reply(`✅ Archivo "${nombre}" sacado y eliminado de la cajafuerte.`)
}

handlerSacar.help = ['sacar']
handlerSacar.tags = ['cajafuerte']
handlerSacar.command = ['sacar', 'get']

// ====== COMANDO 3: CONTRASEÑA ======
let handlerContraseña = async (m, { conn, args, text }) => {
    let numero = m.sender.split('@')[0]
    
    if (!args[0]) {
        return m.reply('⚠️ *Uso correcto:*\n\n.contraseña [tu_contraseña]\n\nEjemplo:\n.contraseña MiClave123')
    }

    let contraseña = args.join(' ')
    let db = leerDB()

    // Verificar si ya tiene contraseña
    let existente = db.findIndex(item => item.numero === numero && item.tipo === 'config')
    
    if (existente !== -1) {
        db[existente].contraseña = contraseña
    } else {
        db.push({
            numero,
            tipo: 'config',
            contraseña,
            fecha: new Date().toISOString()
        })
    }

    guardarDB(db)
    m.reply('🔐 *Contraseña configurada*\n\nAhora necesitarás esta contraseña para sacar archivos de tu cajafuerte.')
}

handlerContraseña.help = ['contraseña']
handlerContraseña.tags = ['cajafuerte']
handlerContraseña.command = ['contraseña', 'password', 'setpass']

export { handlerGuardar as default }
export { handlerSacar }
export { handlerContraseña }
