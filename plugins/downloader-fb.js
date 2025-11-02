import fetch from 'node-fetch'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) return m.reply(
    `📥 Uso correcto:
${usedPrefix + command} <enlace válido de Facebook>

Ejemplo:
${usedPrefix + command} https://www.facebook.com/watch/?v=1234567890`
  )

  try {
    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    // Usando la API nueva
    let api = `https://mayapi.ooguy.com/facebook?url=${encodeURIComponent(args[0])}&apikey=soymaycol<3`
    let res = await fetch(api)
    let json = await res.json()

    if (!json?.status || !json.result?.url) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return m.reply('❌ No se encontró ningún video para ese enlace.')
    }

    let video = json.result
    let caption = `
📹 *Facebook Video Downloader*

━━━━━━━━━━━━━━━
🔰 *Título:* ${video.title}
📁 *Archivo:* ${video.url.split('/').pop()}
⏬ *Enlace original:* 
${args[0]}
━━━━━━━━━━━━━━━
    `.trim()

    await conn.sendMessage(m.chat, {
      video: { url: video.url },
      caption,
      fileName: `${video.title.replace(/\s/g, '_')}.mp4`,
      mimetype: 'video/mp4'
    }, { quoted: m })

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    m.reply('❌ No se pudo obtener el video. Verifica el enlace e intenta nuevamente.')
  }
}

handler.command = ['facebook', 'fb', 'fbvideo']
handler.help = ['fb']
handler.tags = ['downloader']

export default handler
