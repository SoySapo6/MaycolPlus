const defaultImage = 'https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/images%20(8).jpeg'

// Normaliza JIDs (para evitar conflictos entre @lid y @s.whatsapp.net)
function normalizeJid(jid = '') {
  return jid.replace(/:.*@/g, '@').replace('@lid', '@s.whatsapp.net')
}

async function isAdminOrOwner(m, conn) {
  try {
    const groupMetadata = await conn.groupMetadata(m.chat)
    const participant = groupMetadata.participants.find(p => p.id === m.sender)
    return participant?.admin || m.fromMe
  } catch {
    return false
  }
}

const handler = async (m, { conn, command, args }) => {
  if (!m.isGroup) return m.reply('🔒 Este comando solo funciona en grupos.')

  const groupMetadata = await conn.groupMetadata(m.chat)
  const senderData = groupMetadata.participants.find(p => p.id === m.sender)
  const isUserAdmin =
    senderData?.admin === 'admin' ||
    senderData?.admin === 'superadmin' ||
    m.sender === groupMetadata.owner

  if (!isUserAdmin) {
    return m.reply('🚫 Solo los *admins* pueden usar este comando.')
  }

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
  const chat = global.db.data.chats[m.chat]

  if (!chat.blockedUsers) chat.blockedUsers = {}

  const mentioned = m.mentionedJid ? m.mentionedJid[0] : args[0]
  if (!mentioned) return m.reply(`📍 Menciona al usuario que quieres bloquear o desbloquear.`)

  const normalized = normalizeJid(mentioned)

  if (command === 'block') {
    chat.blockedUsers[normalized] = true
    return m.reply(`✅ Usuario bloqueado localmente. El bot lo ignorará en este grupo.`)
  }

  if (command === 'unblock') {
    delete chat.blockedUsers[normalized]
    return m.reply(`✅ Usuario desbloqueado localmente. El bot volverá a responderle.`)
  }
}

handler.command = ['block', 'unblock']
handler.group = true
handler.register = false
handler.tags = ['group']
handler.help = ['block @usuario', 'unblock @usuario']

// 🚫 Ignorar mensajes de usuarios bloqueados en ese grupo
handler.before = async (m, { conn }) => {
  if (!m.isGroup) return
  const chat = global.db.data.chats[m.chat]
  if (!chat || !chat.blockedUsers) return false

  const senderId = normalizeJid(m.key.participant || m.sender)
  if (chat.blockedUsers[senderId]) {
    console.log(`[BOT IGNORADO] Mensaje de usuario bloqueado: ${senderId}`)
    return true // cancela toda respuesta o acción
  }
}

export default handler
