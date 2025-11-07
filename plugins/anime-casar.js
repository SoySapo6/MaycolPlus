import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import https from 'https'

const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)

let marriages = {}

const downloadGif = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const stream = fs.createWriteStream(filepath)
      res.pipe(stream)
      stream.on('finish', () => {
        stream.close()
        resolve()
      })
      stream.on('error', reject)
    }).on('error', reject)
  })
}

const handler = async (m, { conn, command, text }) => {
  let user = m.sender
  let mentioned = m.mentionedJid[0]
  
  if (!mentioned) return conn.reply(m.chat, '❌ Debes mencionar a alguien', m)
  if (mentioned === user) return conn.reply(m.chat, '❌ No puedes casarte contigo mismo', m)
  
  let userName = conn.getName(user)
  let mentionedName = conn.getName(mentioned)
  let chatId = m.chat

  marriages[chatId] = marriages[chatId] || {}

  switch (command) {
    case 'marry':
    case 'casar':
    case 'casarse':
      // Si ya está casado con alguien
      if (marriages[chatId][user] && marriages[chatId][user] !== mentioned) {
        let victima = marriages[chatId][user]
        let victimaNombre = conn.getName(victima)
        
        // Divorcio automático y nuevo matrimonio
        delete marriages[chatId][victima]
        delete marriages[chatId][user]
        marriages[chatId][user] = mentioned
        marriages[chatId][mentioned] = user
        
        let tmpFile = `./tmp/infiel_${Date.now()}.gif`
        
        try {
          await downloadGif('https://media1.tenor.com/m/an0diNvfSSwAAAAC/marriage-anime-sailor-moon.gif', tmpFile)
          await conn.sendMessage(chatId, {
            video: fs.readFileSync(tmpFile),
            gifPlayback: true,
            caption: `💔 ¡ESCÁNDALO! 💔\n\n${userName} fue infiel con ${mentionedName} y dejó a ${victimaNombre}\n\n💍 Ahora ${userName} y ${mentionedName} están casados 💍`,
            mentions: [mentioned, victima]
          }, { quoted: m })
          await unlink(tmpFile)
        } catch (e) {
          console.error(e)
          await conn.reply(chatId, `💔 ¡ESCÁNDALO! 💔\n\n${userName} fue infiel con ${mentionedName} y dejó a ${victimaNombre}\n\n💍 Ahora ${userName} y ${mentionedName} están casados 💍`, m)
        }
      } else {
        // Matrimonio normal
        marriages[chatId][user] = mentioned
        marriages[chatId][mentioned] = user
        
        let tmpFile = `./tmp/marry_${Date.now()}.gif`
        
        try {
          await downloadGif('https://media1.tenor.com/m/an0diNvfSSwAAAAC/marriage-anime-sailor-moon.gif', tmpFile)
          await conn.sendMessage(chatId, {
            video: fs.readFileSync(tmpFile),
            gifPlayback: true,
            caption: `💍✨ ¡FELICIDADES! ✨💍\n\n${userName} se casó con ${mentionedName}\n\n¡Que viva el amor! 💕`,
            mentions: [mentioned]
          }, { quoted: m })
          await unlink(tmpFile)
        } catch (e) {
          console.error(e)
          await conn.reply(chatId, `💍✨ ¡FELICIDADES! ✨💍\n\n${userName} se casó con ${mentionedName}\n\n¡Que viva el amor! 💕`, m)
        }
      }
      break

    case 'divorce':
    case 'divorcio':
    case 'divorciar':
    case 'divorciarse':
      if (!marriages[chatId][user]) return conn.reply(chatId, '❌ No estás casado con nadie', m)
      
      let pareja = marriages[chatId][user]
      let parejaNombre = conn.getName(pareja)
      delete marriages[chatId][pareja]
      delete marriages[chatId][user]
      
      let tmpFile = `./tmp/divorce_${Date.now()}.gif`
      
      try {
        await downloadGif('https://i.gifer.com/K7GC.gif', tmpFile)
        await conn.sendMessage(chatId, {
          video: fs.readFileSync(tmpFile),
          gifPlayback: true,
          caption: `💔😢 FIN DEL AMOR 😢💔\n\n${userName} se divorció de ${parejaNombre}\n\nEl amor se acabó... 😞`,
          mentions: [pareja]
        }, { quoted: m })
        await unlink(tmpFile)
      } catch (e) {
        console.error(e)
        await conn.reply(chatId, `💔😢 FIN DEL AMOR 😢💔\n\n${userName} se divorció de ${parejaNombre}\n\nEl amor se acabó... 😞`, m)
      }
      break
  }
}

handler.help = ['marry @usuario', 'divorce', 'casar @usuario', 'divorcio']
handler.tags = ['fun']
handler.command = ['marry', 'divorce', 'casar', 'casarse', 'divorcio', 'divorciar', 'divorciarse']
handler.group = true

export default handler
