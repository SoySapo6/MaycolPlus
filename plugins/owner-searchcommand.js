import fs from 'fs'
import path from 'path'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text) return m.reply(`⚠️ Usa: *${usedPrefix + command} <nombre del comando>*`)

    const pluginsPath = './plugins'
    const files = fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'))

    let resultados = []

    for (const file of files) {
      const filePath = path.join(pluginsPath, file)
      const content = fs.readFileSync(filePath, 'utf8')

      // Buscar coincidencias en handler.command
      const regex = new RegExp(`handler\\.command\\s*=\\s*(?:\\[|\\/\\^?)["'\`]?${text}["'\`]?`, 'i')
      if (regex.test(content)) {
        resultados.push(file)
      }
    }

    if (!resultados.length) {
      return m.reply(`❌ No se encontró ningún comando llamado *${text}*.`)
    }

    let mensaje = `
📂 *Resultado de búsqueda:*
🔍 Comando: ${text}
🧩 Archivos encontrados:
${resultados.map(f => '• ' + f).join('\n')}
    `.trim()

    m.reply(mensaje)
  } catch (e) {
    console.error(e)
    m.reply('⚠️ Ocurrió un error buscando el comando.')
  }
}

handler.command = /^searchcommand$/i
handler.help = ['searchcommand <comando>']
handler.tags = ['owner']
handler.rowner = true // solo owner

export default handler
