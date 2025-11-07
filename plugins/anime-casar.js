import fs from 'fs'
import path from 'path'

let marriages = {}

const handler = async (m, { conn, command, text }) => {
  let user = m.sender
  let mentioned = m.mentionedJid[0]
  if (!mentioned) return conn.reply(m.chat, '❌ Debes mencionar a alguien para usar este comando', m)
  
  let userName = conn.getName(user)
  let mentionedName = conn.getName(mentioned)
  let chatId = m.chat

  marriages[chatId] = marriages[chatId] || {}

  switch (command) {
    case 'marry':
    case 'casar':
    case 'casarse':
      // Verificar si ya está casado con otra persona
      if (marriages[chatId][user] && marriages[chatId][user] !== mentioned) {
        let amante = mentionedName
        let victima = marriages[chatId][user]
        let victimaNombre = conn.getName(victima)
        
        // Automáticamente divorciarse y casarse con el amante
        delete marriages[chatId][victima]
        delete marriages[chatId][user]
        
        marriages[chatId][user] = mentioned
        marriages[chatId][mentioned] = user
        
        await conn.sendMessage(chatId, { 
          video: { url: 'https://media1.tenor.com/m/an0diNvfSSwAAAAC/marriage-anime-sailor-moon.gif' }, 
          gifPlayback: true, 
          caption: `💔💍 ¡ESCÁNDALO! 💍💔\n\n${userName} fue infiel con ${amante} y dejó a ${victimaNombre}\n\nAhora ${userName} está casado(a) con ${amante} 😈💕`, 
          mentions: [mentioned, victima],
          contextInfo: {
            mentionedJid: [mentioned, victima],
            externalAdReply: {
              title: '💔 ¡INFIDELIDAD DETECTADA! 💔',
              body: `${userName} cambió de pareja`,
              thumbnailUrl: 'https://i.imgur.com/5zC5VWH.jpeg',
              sourceUrl: 'https://github.com/SoyMaycol',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m })
      } 
      // Si ya está casado con la misma persona
      else if (marriages[chatId][user] && marriages[chatId][user] === mentioned) {
        await conn.reply(chatId, `💍 Ya estás casado(a) con ${mentionedName}, no puedes casarte dos veces con la misma persona 😊`, m)
      }
      // Casamiento normal
      else {
        marriages[chatId][user] = mentioned
        marriages[chatId][mentioned] = user
        
        await conn.sendMessage(chatId, { 
          video: { url: 'https://media1.tenor.com/m/an0diNvfSSwAAAAC/marriage-anime-sailor-moon.gif' }, 
          gifPlayback: true, 
          caption: `💍✨ ¡BODA REALIZADA! ✨💍\n\n${userName} se casó con ${mentionedName}\n\n¡Felicidades a la feliz pareja! 🎊💕`, 
          mentions: [mentioned],
          contextInfo: {
            mentionedJid: [mentioned],
            externalAdReply: {
              title: '💍 ¡Nueva Boda! 💍',
              body: `${userName} ❤️ ${mentionedName}`,
              thumbnailUrl: 'https://i.imgur.com/BXjeEar.jpeg',
              sourceUrl: 'https://github.com/SoyMaycol',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m })
      }
      break

    case 'divorce':
    case 'divorciar':
    case 'divorcio':
      if (!marriages[chatId][user]) return conn.reply(chatId, '💔 No estás casado(a) con nadie, no puedes divorciarte', m)
      
      let pareja = marriages[chatId][user]
      let parejaNombre = conn.getName(pareja)
      
      delete marriages[chatId][pareja]
      delete marriages[chatId][user]
      
      await conn.sendMessage(chatId, { 
        video: { url: 'https://i.gifer.com/K7GC.gif' }, 
        gifPlayback: true, 
        caption: `💔😢 ¡DIVORCIO! 😢💔\n\n${userName} se divorció de ${parejaNombre}\n\nLa relación ha terminado... 😔`, 
        mentions: [pareja],
        contextInfo: {
          mentionedJid: [pareja],
          externalAdReply: {
            title: '💔 ¡Divorcio Oficial! 💔',
            body: `${userName} y ${parejaNombre} se separaron`,
            thumbnailUrl: 'https://i.imgur.com/0jXqhXb.jpeg',
            sourceUrl: 'https://github.com/SoyMaycol',
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m })
      break
  }
}

handler.help = ['marry @usuario', 'casar @usuario', 'divorce', 'divorciar']
handler.tags = ['fun']
handler.command = ['marry', 'casar', 'casarse', 'divorce', 'divorciar', 'divorcio']
handler.group = true

export default handler
