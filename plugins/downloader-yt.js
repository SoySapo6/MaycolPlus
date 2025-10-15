import yts from "yt-search"

const handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」
│
├─ Ay bebé, necesito algo para trabajar~
├─ Dame el nombre de un video o URL de YouTube
├─ y yo haré magia para ti... ♡
│
╰─✦`)

  await m.react("🔥")

  try {
    let url = text
    let title = "Desconocido"
    let authorName = "Desconocido"
    let durationTimestamp = "Desconocida"
    let views = "Desconocidas"
    let thumbnail = ""

    if (!text.startsWith("https://")) {
      const res = await yts(text)
      if (!res || !res.videos || res.videos.length === 0) {
        return m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」
│
├─ Mmm... no encuentro nada así bebé
├─ Intenta con algo más específico
╰─✦`)
      }
      const video = res.videos[0]
      title = video.title || title
      authorName = video.author?.name || authorName
      durationTimestamp = video.timestamp || durationTimestamp
      views = video.views || views
      url = video.url || url
      thumbnail = video.thumbnail || ""
    }

    const isAudio = ["play", "playaudio", "ytmp3"].includes(command)
    const isVideo = ["play2", "playvid", "ytv", "ytmp4"].includes(command)

    if (isAudio) {
      await downloadMedia(conn, m, url, title, thumbnail, "mp3")
    } else if (isVideo) {
      await downloadMedia(conn, m, url, title, thumbnail, "mp4")
    } else {
      await m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」
│
├─ 「❀」${title}
│
├─ ✧ Canal: ${authorName}
├─ ✧ Duración: ${durationTimestamp}
├─ ✧ Vistas: ${views}
│
├─ Usa:
│   • .ytmp3 ${url}
│   • .ytmp4 ${url}
╰─✦`)
    }

  } catch (error) {
    console.error("Error general:", error)
    await m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」
│
├─ Ay no bebé, algo salió mal...
├─ Pero no te preocupes, sigo siendo tuya~ ♡
├─ Error: ${error.message}
╰─✦`)
    await m.react("💔")
  }
}

const downloadMedia = async (conn, m, url, title, thumbnail, type) => {
  let progress = 10
  let progressInterval
  let lastProgressText = ""

  try {
    const cleanTitle = cleanName(title) + (type === "mp3" ? ".mp3" : ".mp4")

    progressInterval = setInterval(async () => {
      if (progress < 80) {
        progress += Math.floor(Math.random() * 5) + 2
        if (progress > 80) progress = 80
        const progressBar = createProgressBar(progress)
        const message = `╭─❍「 ✦ MaycolPlus ✦ 」
│
├─ 「❀」${title}
│
├─ Procesando tu ${type === "mp3" ? "audio" : "video"}... ♡
│
├─ ${progressBar} ${progress}%
╰─✦`
        if (message !== lastProgressText) {
          lastProgressText = message
          await updateMessage(conn, m.chat, lastProgressText, thumbnail)
        }
      }
    }, 800)

    const apiUrl = `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(url)}&type=${type}&apikey=SoyMaycol<3`
    const response = await fetch(apiUrl)
    const data = await response.json()

    if (!data || !data.status || !data.result || !data.result.url) {
      throw new Error("No pude conseguir el archivo bebé")
    }

    progress = 90
    const progressBar90 = createProgressBar(progress)
    const message90 = `╭─❍「 ✦ MaycolPlus ✦ 」
│
├─ 「❀」${data.result.title || title}
│
├─ Ya casi termino contigo~ ♡
│
├─ ${progressBar90} ${progress}%
╰─✦`
    await updateMessage(conn, m.chat, message90, thumbnail)
    clearInterval(progressInterval)

    if (type === "mp3") {
      await conn.sendMessage(m.chat, {
        audio: { url: data.result.url },
        mimetype: "audio/mpeg",
        fileName: cleanTitle
      }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, {
        video: { url: data.result.url },
        mimetype: "video/mp4",
        fileName: cleanTitle
      }, { quoted: m })
    }

    const finalMessage = `╭─❍「 ✦ MaycolPlus ✦ 」
│
├─ 「❀」${data.result.title || title}
│
├─ ¡Listo mi amor! ♡
├─ ${createProgressBar(100)} 100%
╰─✦`
    await updateMessage(conn, m.chat, finalMessage, thumbnail)
    await m.react("💋")

  } catch (error) {
    clearInterval(progressInterval)
    console.error("Error descargando:", error)
    const errorMessage = `╭─❍「 ✦ MaycolPlus ✦ 」
│
├─ 「❀」${title}
│
├─ Ay bebé... algo no salió bien
├─ ${error.message}
╰─✦`
    await updateMessage(conn, m.chat, errorMessage, thumbnail)
    await m.react("😢")
  }
}

const updateMessage = async (conn, chatId, newText, thumbnail) => {
  if (thumbnail) {
    await conn.sendMessage(chatId, { image: { url: thumbnail }, caption: newText })
  } else {
    await conn.sendMessage(chatId, { text: newText })
  }
}

const createProgressBar = (percentage) => {
  const totalBars = 10
  const filledBars = Math.floor((percentage / 100) * totalBars)
  const emptyBars = totalBars - filledBars
  return "▓".repeat(filledBars) + "░".repeat(emptyBars)
}

const cleanName = (name) => name.replace(/[^\w\s-_.]/gi, "").substring(0, 50)

handler.command = handler.help = ["play", "playaudio", "ytmp3", "play2", "playvid", "ytv", "ytmp4", "yt"]
handler.tags = ["descargas"]
handler.register = true

export default handler
