import fs from 'fs'
import path from 'path'

const marriagesFile = path.join('./database/marriages.json')
if (!fs.existsSync(marriagesFile)) fs.writeFileSync(marriagesFile, '{}')

let marry = async (m, { conn }) => {
  let data = JSON.parse(fs.readFileSync(marriagesFile))
  let who = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
  if (!who) return m.reply('Etiqueta o responde a alguien para casarte.')
  if (who === m.sender) return m.reply('No puedes casarte contigo mismo.')

  let sender = m.sender
  let name1 = conn.getName(sender)
  let name2 = conn.getName(who)

  let marriedTo = data[sender]
  let marriedBy = Object.keys(data).find(k => data[k] === sender)

  if (marriedTo && marriedTo !== who) {
    let victim = conn.getName(marriedTo)
    let str = `💔 ${name1} le fue infiel a ${victim} con ${name2} 😭\n¡Infiel y amante!`
    await conn.sendMessage(m.chat, { gifPlayback: true, video: { url: 'https://media1.tenor.com/m/an0diNvfSSwAAAAC/marriage-anime-sailor-moon.gif' }, caption: str, mentions: [who, marriedTo] }, { quoted: m })
    return
  }

  if (marriedBy && marriedBy !== who) {
    let victim = conn.getName(marriedBy)
    let str = `💔 ${name1} le fue infiel a ${victim} con ${name2} 😭\n¡Infiel y amante!`
    await conn.sendMessage(m.chat, { gifPlayback: true, video: { url: 'https://media1.tenor.com/m/an0diNvfSSwAAAAC/marriage-anime-sailor-moon.gif' }, caption: str, mentions: [who, marriedBy] }, { quoted: m })
    return
  }

  data[sender] = who
  fs.writeFileSync(marriagesFile, JSON.stringify(data))
  let str = `💞 ${name1} y ${name2} se han casado 💍✨`
  await conn.sendMessage(m.chat, { gifPlayback: true, video: { url: 'https://media1.tenor.com/m/an0diNvfSSwAAAAC/marriage-anime-sailor-moon.gif' }, caption: str, mentions: [who] }, { quoted: m })
}

let divorce = async (m, { conn }) => {
  let data = JSON.parse(fs.readFileSync(marriagesFile))
  let sender = m.sender
  let name1 = conn.getName(sender)

  if (!data[sender] && !Object.values(data).includes(sender)) return m.reply('No estás casado con nadie.')

  let partner = data[sender] || Object.keys(data).find(k => data[k] === sender)
  let name2 = conn.getName(partner)
  delete data[sender]
  if (data[partner] === sender) delete data[partner]
  fs.writeFileSync(marriagesFile, JSON.stringify(data))

  let str = `💔 ${name1} y ${name2} se han divorciado 😢`
  await conn.sendMessage(m.chat, { gifPlayback: true, video: { url: 'https://i.gifer.com/K7GC.gif' }, caption: str, mentions: [partner] }, { quoted: m })
}

marry.help = ['marry']
marry.tags = ['fun']
marry.command = ['marry','casar']
marry.group = true

divorce.help = ['divorce']
divorce.tags = ['fun']
divorce.command = ['divorce','divorcio']
divorce.group = true

export default [marry, divorce]
