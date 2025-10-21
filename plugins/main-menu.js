// ♥ 𝙼𝚎𝚗𝚞 𝚍𝚎 𝚂𝚘𝚢𝙼𝚊𝚢𝚌𝚘𝚕 ♥
// ᵁˢᵃ ᵉˢᵗᵉ ᶜᵒᵈⁱᵍᵒ ˢⁱᵉᵐᵖʳᵉ ᶜᵒⁿ ᶜʳᵉᵈⁱᵗᵒˢ
import fs from 'fs'
import { join } from 'path'
import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

let handler = async (m, { conn }) => {
  let userId = m.mentionedJid?.[0] || m.sender
  let user = global.db.data.users[userId]
  let name = conn.getName(userId)
  let _uptime = process.uptime() * 1000
  let uptime = clockString(_uptime)
  let totalreg = Object.keys(global.db.data.users).length

  let hour = new Intl.DateTimeFormat('es-PE', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'America/Lima'
  }).format(new Date())

  let saludo = hour < 4  ? "🌌 Aún es de madrugada... las almas rondan 👻" :
               hour < 7  ? "🌅 El amanecer despierta... buenos inicios ✨" :
               hour < 12 ? "🌞 Buenos días, que la energía te acompañe 💫" :
               hour < 14 ? "🍽️ Hora del mediodía... ¡a recargar fuerzas! 🔋" :
               hour < 18 ? "🌄 Buenas tardes... sigue brillando como el sol 🌸" :
               hour < 20 ? "🌇 El atardecer pinta el cielo... momento mágico 🏮" :
               hour < 23 ? "🌃 Buenas noches... que los espíritus te cuiden 🌙" :
               "🌑 Es medianoche... los fantasmas susurran en la oscuridad 👀"

  let categories = {}
  for (let plugin of Object.values(global.plugins)) {
    if (!plugin.help || !plugin.tags) continue
    for (let tag of plugin.tags) {
      if (!categories[tag]) categories[tag] = []
      categories[tag].push(...plugin.help.map(cmd => `#${cmd}`))
    }
  }

  let decoEmojis = ['🌙','👻','🪄','🏮','📜','💫','😈','🍡','🔮','🌸','🪦','✨']
  let emojiRandom = () => decoEmojis[Math.floor(Math.random() * decoEmojis.length)]

  let menuText = `
╔ 𖤐 𝐌𝐚𝐲𝐜𝐨𝐥ℙ𝕝𝕦𝕤 𖤐 ╗

[ ☾ ] Espíritu: @${userId.split('@')[0]}
[ ☀︎ ] Tiempo observándote: ${uptime}
[ ✦ ] Espíritus registrados: ${totalreg}

╚════════════╝

━━━━━━━━━━━━━━━

${saludo}

`.trim()

  for (let [tag, cmds] of Object.entries(categories)) {
    let tagName = tag.toUpperCase().replace(/_/g,' ')
    let deco = emojiRandom()
    menuText += `

╭━ ${deco} ${tagName} ━╮
${cmds.map(cmd => `│ ▪️ ${cmd}`).join('\n')}
╰─━━━━━━━━━━━╯`
  }

  const videoPath = './storage/videos/lv_0_20251012222157.mp4'
  const nativeButtons = [
    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '★ Canal de WhatsApp', url: 'https://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R' }) },
    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '★ Sobre mi Creador', url: 'https://soymaycol.is-a.dev' }) },
    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '★ Doname!', url: 'https://www.paypal.com/paypalme/soymaycol' }) }
  ]

  let media = await prepareWAMessageMedia({ video: fs.readFileSync(videoPath) }, { upload: conn.waUploadToServer })

  const header = proto.Message.InteractiveMessage.Header.fromObject({ hasMediaAttachment: true, videoMessage: media.videoMessage })

  const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
    body: proto.Message.InteractiveMessage.Body.fromObject({ text: menuText }),
    footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: '> Hecho por *SoyMaycol* <3' }),
    header,
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons: nativeButtons })
  })

  const msg = generateWAMessageFromContent(m.chat, { interactiveMessage }, { userJid: conn.user.jid, quoted: m })
  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu','menú','help','ayuda']
handler.register = true

export default handler

function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return `${h}h ${m}m ${s}s`
}
