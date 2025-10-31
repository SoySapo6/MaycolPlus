const defaultImage = 'https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/images%20(8).jpeg'

const handler = async (m, { conn, command, args }) => {
  if (!m.isGroup) return m.reply('🔒 Este comando solo funciona en grupos.')

  const groupMetadata = await conn.groupMetadata(m.chat)
  const senderData = groupMetadata.participants.find(p => p.id === m.sender)

  const isAdmin = senderData?.admin === 'admin' || senderData?.admin === 'superadmin' || m.sender === groupMetadata.owner
  if (!isAdmin) return m.reply('🚫 Solo los *admins* pueden usar este comando.')

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
  const chat = global.db.data.chats[m.chat]
  if (!chat.blockedUsers) chat.blockedUsers = {}

  // 🔎 Detectar a quién se quiere bloquear
  let mentioned = m.mentionedJid && m.mentionedJid[0]
  if (!mentioned && m.quoted) mentioned = m.quoted.sender
  if (!mentioned && args[0]) {
    const number = args[0].replace(/[^0-9]/g, '')
    if (number) mentioned = number + '@lid'
  }

  if (!mentioned) {
    return m.reply(`📍 Usa:\n> *.${command} @usuario*\nO responde a su mensaje.`)
  }

  // 🔒 Bloquear / desbloquear
  if (command === 'block') {
    chat.blockedUsers[mentioned] = true
    return m.reply(`✅ Usuario ${await conn.getName(mentioned)} bloqueado localmente. El bot lo ignorará en este grupo.`)
  }

  if (command === 'unblock') {
    if (chat.blockedUsers[mentioned]) {
      delete chat.blockedUsers[mentioned]
      return m.reply(`✅ Usuario ${await conn.getName(mentioned)} desbloqueado. El bot volverá a responderle.`)
    } else {
      return m.reply(`⚠️ Ese usuario no estaba bloqueado.`)
    }
  }
}

handler.command = ['block', 'unblock']
handler.group = true
handler.admin = false
handler.tags = ['group']
handler.help = ['block @usuario', 'unblock @usuario']

// 🚫 Interceptor para ignorar bloqueados
handler.before = async (m, { conn }) => {
  if (!m.isGroup) return false

  const chat = global.db.data.chats[m.chat]
  if (!chat || !chat.blockedUsers) return false

  const sender = m.sender || m.key.participant
  if (chat.blockedUsers[sender]) {
    console.log(`🚫 Ignorando mensaje de ${sender} (bloqueado en ${m.chat})`)
    return true // Detiene cualquier respuesta
  }

  return false
}

export default handler
