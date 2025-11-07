import fs from 'fs'
import path from 'path'

let marriages = {}

const handler = async (m, { conn, command, text }) => {
  let user = m.sender
  let mentioned = m.mentionedJid[0]
  if (!mentioned) return conn.reply(m.chat, 'Menciona a alguien', m)
  let userName = conn.getName(user)
  let mentionedName = conn.getName(mentioned)
  let chatId = m.chat

  marriages[chatId] = marriages[chatId] || {}

  switch (command) {
    case 'marry':
      if (marriages[chatId][user] && marriages[chatId][user] !== mentioned) {
        let amante = mentionedName
        let victima = conn.getName(marriages[chatId][user])
        await conn.sendMessage(chatId, { video: { url: 'https://media1.tenor.com/m/an0diNvfSSwAAAAC/marriage-anime-sailor-moon.gif' }, gifPlayback: true, caption: `💔 ${userName} fue infiel con ${amante} y dejó a ${victima} triste 💔`, mentions: [mentioned, marriages[chatId][user]] }, { quoted: m })
      } else {
        marriages[chatId][user] = mentioned
        marriages[chatId][mentioned] = user
        await conn.sendMessage(chatId, { video: { url: 'https://media1.tenor.com/m/an0diNvfSSwAAAAC/marriage-anime-sailor-moon.gif' }, gifPlayback: true, caption: `💍 ${userName} se casó con ${mentionedName} 💍`, mentions: [mentioned] }, { quoted: m })
      }
      break

    case 'divorce':
      if (!marriages[chatId][user]) return conn.reply(chatId, 'No estás casado con nadie', m)
      let pareja = marriages[chatId][user]
      delete marriages[chatId][pareja]
      delete marriages[chatId][user]
      await conn.sendMessage(chatId, { video: { url: 'https://i.gifer.com/K7GC.gif' }, gifPlayback: true, caption: `💔 ${userName} se divorció de ${conn.getName(pareja)} 💔`, mentions: [pareja] }, { quoted: m })
      break
  }
}

handler.help = ['marry @usuario', 'divorce']
handler.tags = ['fun']
handler.command = ['marry', 'divorce']
handler.group = true

export default handler
