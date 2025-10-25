// 🧪 COMANDO: todos
// 👨‍🔬 Inspirado en Senku Ishigami — “¡La ciencia no avanza sola, sino con todos los miembros del equipo!” ⚗️

const handler = async (m, { isOwner, isAdmin, conn, text, participants, args, command }) => {
  const mensaje = args.join` `
  const info = mensaje ? `*» 𝔸ℕ𝕌ℕℂ𝕀𝕆 𝔾𝕃𝕆𝔹𝔸𝕃:* ${mensaje}` : '*» 𝕀ℕ𝕍𝕆ℂ𝔸ℂ𝕀𝕆́ℕ 𝔾𝔼ℕ𝔼ℝ𝔸𝕃 𝔻𝔼𝕃 𝔼ℚ𝕌𝕀ℙ𝕆*'
  const nombreBot = global.botname || '𝕭𝖔𝖙 𝖉𝖊 𝕾𝖊𝖓𝖐𝖚'
  const versionBot = global.vs || 'v1.0.0'

  let texto = `🧬 *𝓘𝓝𝓥𝓞𝓒𝓐𝓒𝓘𝓞́𝓝 𝓒𝓞ℒ𝓔𝓒𝓣𝓘𝓥𝓐* 🧬\n`
  texto += `──────────────────────────\n`
  texto += `👨‍🔬 *𝕮𝖎𝖊𝖓𝖙𝖎́𝖋𝖎𝖈𝖔𝖘 𝖈𝖔𝖓𝖛𝖔𝖈𝖆𝖉𝖔𝖘:* ${participants.length}\n`
  texto += `📢 ${info}\n\n`
  texto += `╭─⬣「 *${nombreBot}* 」⬣\n`

  for (const miembro of participants) {
    texto += `│ 🧪 @${miembro.id.split('@')[0]}\n`
  }

  texto += `╰──────────────────⬣\n`

  await conn.sendMessage(m.chat, {
    text: texto,
    mentions: participants.map(a => a.id)
  })
}

handler.help = ['invocar']
handler.tags = ['grupo']
handler.command = ['invocar', 'tagall']
handler.admin = true
handler.group = true

export default handler

