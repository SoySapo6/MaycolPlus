const handler = async (m, { conn, text }) => {
  try {
    if (!text) {
      return conn.reply(m.chat, '❌ Debes escribir un secreto.\n\n*Ejemplo:* .addsecret Me comí la última galleta', m)
    }

    // Obtener la base de datos actual
    const viewUrl = 'https://mayapi.ooguy.com/db?action=view&apikey=soymaycol%3C3'
    const viewResponse = await fetch(viewUrl)
    const db = await viewResponse.json()

    // Contar cuántos secretos hay
    const secretCount = Object.keys(db).length
    const newSecretNumber = secretCount + 1
    const newKey = `secreto${newSecretNumber}`

    // Agregar el nuevo secreto
    const addUrl = `https://mayapi.ooguy.com/db?action=set&key1=${encodeURIComponent(newKey)}&key2=${encodeURIComponent(text)}&apikey=soymaycol%3C3`
    const addResponse = await fetch(addUrl)
    const result = await addResponse.json()

    await conn.reply(m.chat, `✅ *Secreto anónimo guardado exitosamente*\n\n🔢 Número de secreto: *${newSecretNumber}*\n📝 Total de secretos: *${newSecretNumber}*\n\n🤫 Tu secreto ha sido guardado de forma anónima.`, m)

  } catch (e) {
    console.error('[ERROR SECRETO-ADD]', e)
    conn.reply(m.chat, '❌ Ocurrió un error al guardar el secreto. Intenta nuevamente.', m)
  }
}

handler.help = ['addsecret <texto>']
handler.tags = ['fun']
handler.command = ['addsecret', 'agregarsecret', 'secreto']
handler.register = true

export default handler
