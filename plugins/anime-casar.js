import fs from 'fs'
import path from 'path'

let marriages = {}

const handler = async (m, { conn, command, text }) => {
  let user = m.sender
  let mentioned = m.mentionedJid[0]
  
  if (!mentioned && !['divorce', 'divorciar'].includes(command)) {
    return conn.reply(m.chat, '💔 Menciona a alguien para casarte', m)
  }
  
  let userName = conn.getName(user)
  let mentionedName = mentioned ? conn.getName(mentioned) : ''
  let chatId = m.chat

  marriages[chatId] = marriages[chatId] || {}

  switch (command) {
    case 'marry':
    case 'casar':
    case 'casarse':
      // Verificar si ya está casado con alguien diferente
      if (marriages[chatId][user] && marriages[chatId][user] !== mentioned) {
        let amante = mentionedName
        let victima = conn.getName(marriages[chatId][user])
        let parejaPasada = marriages[chatId][user]
        
        // Divorcio automático de la pareja anterior
        delete marriages[chatId][parejaPasada]
        delete marriages[chatId][user]
        
        // Nuevo matrimonio con el amante
        marriages[chatId][user] = mentioned
        marriages[chatId][mentioned] = user
        
        let mentionsList = [mentioned, parejaPasada]
        
        await conn.sendMessage(chatId, {
          video: { url: 'https://media1.tenor.com/m/an0diNvfSSwAAAAC/marriage-anime-sailor-moon.gif' },
          gifPlayback: true,
          caption: `💔💍 ¡ESCÁNDALO! 💍💔\n\n${userName} fue infiel con ${amante} y dejó a ${victima}\n\nAhora ${userName} está casado(a) con ${amante} 💕`,
          mentions: mentionsList,
          contextInfo: {
            mentionedJid: mentionsList,
            externalAdReply: {
              title: '💔 ¡INFIDELIDAD DETECTADA! 💔',
              body: `${userName} dejó a ${victima} por ${amante}`,
              thumbnailUrl: 'https://i.imgur.com/rKUZnI7.jpeg',
              sourceUrl: 'https://github.com/SoyMaycol',
              mediaType: 1,
              renderLargerThumbnail: true
            },
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363424241780448@newsletter',
              newsletterName: '𝐒𝐨𝐲𝐌𝐚𝐲𝐜𝐨𝐥 <𝟑 • Actualizaciones',
              serverMessageId: -1,
            },
            forwardingScore: 999
          }
        }, { quoted: m })
      } else {
        // Matrimonio normal
        marriages[chatId][user] = mentioned
        marriages[chatId][mentioned] = user
        
        await conn.sendMessage(chatId, {
          video: { url: 'https://media1.tenor.com/m/an0diNvfSSwAAAAC/marriage-anime-sailor-moon.gif' },
          gifPlayback: true,
          caption: `💍✨ ¡FELICIDADES! ✨💍\n\n${userName} se casó con ${mentionedName}\n\n¡Que viva el amor! 💕`,
          mentions: [mentioned],
          contextInfo: {
            mentionedJid: [mentioned],
            externalAdReply: {
              title: '💍 ¡BODA EN CURSO! 💍',
              body: `${userName} y ${mentionedName} unidos en matrimonio`,
              thumbnailUrl: 'https://i.imgur.com/rKUZnI7.jpeg',
              sourceUrl: 'https://github.com/SoyMaycol',
              mediaType: 1,
              renderLargerThumbnail: true
            },
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363424241780448@newsletter',
              newsletterName: '𝐒𝐨𝐲𝐌𝐚𝐲𝐜𝐨𝐥 <𝟑 • Actualizaciones',
              serverMessageId: -1,
            },
            forwardingScore: 999
          }
        }, { quoted: m })
      }
      break

    case 'divorce':
    case 'divorciar':
    case 'divorcio':
      if (!marriages[chatId][user]) {
        return conn.reply(chatId, '💔 No estás casado(a) con nadie', m)
      }
      
      let pareja = marriages[chatId][user]
      let parejaName = conn.getName(pareja)
      
      delete marriages[chatId][pareja]
      delete marriages[chatId][user]
      
      await conn.sendMessage(chatId, {
        video: { url: 'https://i.gifer.com/K7GC.gif' },
        gifPlayback: true,
        caption: `💔😢 ¡DIVORCIO! 😢💔\n\n${userName} se divorció de ${parejaName}\n\nEl amor se acabó... 💔`,
        mentions: [pareja],
        contextInfo: {
          mentionedJid: [pareja],
          externalAdReply: {
            title: '💔 ¡DIVORCIO CONFIRMADO! 💔',
            body: `${userName} y ${parejaName} terminaron su relación`,
            thumbnailUrl: 'https://i.imgur.com/rKUZnI7.jpeg',
            sourceUrl: 'https://github.com/SoyMaycol',
            mediaType: 1,
            renderLargerThumbnail: true
          },
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363424241780448@newsletter',
            newsletterName: '𝐒𝐨𝐲𝐌𝐚𝐲𝐜𝐨𝐥 <𝟑 • Actualizaciones',
            serverMessageId: -1,
          },
          forwardingScore: 999
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
