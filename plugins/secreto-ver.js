const handler = async (m, { conn }) => {
  try {
    // Obtener la base de datos
    const viewUrl = 'https://mayapi.ooguy.com/db?action=view&apikey=soymaycol%3C3'
    const response = await fetch(viewUrl)
    const db = await response.json()

    // Verificar si hay secretos
    const secretKeys = Object.keys(db)
    if (secretKeys.length === 0) {
      return conn.reply(m.chat, '❌ No hay secretos guardados aún.\n\n💡 Usa *.addsecret <tu secreto>* para agregar uno.', m)
    }

    // Seleccionar un secreto aleatorio
    const randomKey = secretKeys[Math.floor(Math.random() * secretKeys.length)]
    const randomSecret = db[randomKey]

    const message = `🤫 *SECRETO ANÓNIMO*\n\n📝 ${randomSecret}\n\n━━━━━━━━━━━━━━━\n🔢 Total de secretos: *${secretKeys.length}*`

    await conn.reply(m.chat, message, m)

  } catch (e) {
    console.error('[ERROR SECRETO-RANDOM]', e)
    conn.reply(m.chat, '❌ Ocurrió un error al obtener un secreto. Intenta nuevamente.', m)
  }
}

handler.help = ['secret', 'secreto']
handler.tags = ['fun']
handler.command = ['secret', 'secretorandom', 'versecret', 'secreto', 'versecreto']
handler.register = true

export default handler
