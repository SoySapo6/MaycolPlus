import fetch from 'node-fetch'

const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) return m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」
│
├─ Ay bebé, necesito un enlace de TikTok~
├─ Uso correcto:
│  ${usedPrefix + command} <enlace válido>
├─ Ejemplo:
│  ${usedPrefix + command} https://www.tiktok.com/@usuario/video/123456789
╰─✦`)

  await m.react("🔥")

  try {
    let urlVideo = ""
    let title = "Desconocido"
    let authorName = "Desconocido"
    let duration = "Desconocida"
    let views = 0
    let likes = 0
    let comments = 0
    let shares = 0
    let thumbnail = ""

    try {
      const apiMay = `https://mayapi.ooguy.com/tiktok?url=${encodeURIComponent(args[0])}&apikey=soymaycol<3`
      const resMay = await fetch(apiMay)
      const dataMay = await resMay.json()
      if (dataMay.status && dataMay.result?.url) {
        urlVideo = dataMay.result.url
        title = dataMay.result.title || title
      } else throw new Error("MayAPI fallo")
    } catch {
      const apiAdonix = `https://api-adonix.ultraplus.click/download/tiktok?apikey=SoyMaycol<3&url=${encodeURIComponent(args[0])}`
      const resAdonix = await fetch(apiAdonix)
      const dataAdonix = await resAdonix.json()
      if (dataAdonix.status === "true" && dataAdonix.data?.video) {
        urlVideo = dataAdonix.data.video
        title = dataAdonix.data.title || title
        authorName = dataAdonix.data.author.name || authorName
        duration = dataAdonix.data.duration || duration
        views = dataAdonix.data.views || views
        likes = dataAdonix.data.likes || likes
        comments = dataAdonix.data.comments || comments
        shares = dataAdonix.data.shares || shares
        thumbnail = dataAdonix.data.thumbnail || ""
      } else throw new Error("Adonix fallo")
    }

    const msgInfo = `╭─❍「 ✦ MaycolPlus ✦ 」
│
├─ 「❀」${title}
│
├─ ✧ Autor: ${authorName}
├─ ✧ Duración: ${duration} seg
├─ ✧ Vistas: ${views.toLocaleString()}
├─ ✧ Likes: ${likes.toLocaleString()}
├─ ✧ Comentarios: ${comments.toLocaleString()}
├─ ✧ Compartidos: ${shares.toLocaleString()}
╰─✦`

    if (thumbnail) {
      await conn.sendMessage(m.chat, { image: { url: thumbnail }, caption: msgInfo }, { quoted: m })
    } else {
      await m.reply(msgInfo)
    }

    await conn.sendMessage(m.chat, {
      video: { url: urlVideo },
      caption: `╭─❍「 ✦ MaycolPlus ✦ 」
│
├─ 「❀」${title}
│
├─ ¡Listo mi amor! ♡
├─ Disfruta lo que preparé solo para ti~
╰─✦`,
      fileName: `${title}.mp4`,
      mimetype: 'video/mp4'
    }, { quoted: m })

    await m.react("💋")

  } catch (err) {
    console.error(err)
    await m.react("❌")
    m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」
│
├─ Ay bebé... algo no salió bien
├─ ${err.message}
╰─✦`)
  }
}

handler.command = ['tiktok', 'tt']
handler.help = ['tiktok']
handler.tags = ['downloader']
handler.register = true

export default handler
