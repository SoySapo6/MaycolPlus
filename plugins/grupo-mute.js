async function isAdminOrOwner(m, conn) {
  try {
    const groupMetadata = await conn.groupMetadata(m.chat)
    const participant = groupMetadata.participants.find(p => p.id === m.sender)
    return participant?.admin || m.fromMe
  } catch {
    return false
  }
}

const handler = async (m, { conn, command, args, isAdmin }) => {
  if (!m.isGroup) return m.reply('🔒 Este comando solo funciona en grupos.')

  if (!isAdmin) return m.reply('❌ Solo los administradores pueden usar este comando.')

  // Asegurarse que la estructura del chat en la DB exista
  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
  const chat = global.db.data.chats[m.chat]

  // Inicializar mutedUsers si no existe
  if (!chat.mutedUsers) chat.mutedUsers = {}

  const mentioned = m.mentionedJid && m.mentionedJid[0]
  if (!mentioned) return m.reply('✳️ Menciona a un usuario para mute o unmute.')

  const isMuted = !!chat.mutedUsers[mentioned]

  if (command === 'mute') {
    if (isMuted) return m.reply('⚠️ Este usuario ya está muteado.')
    chat.mutedUsers[mentioned] = true
    return m.reply(`✅ Usuario ${mentioned.split('@')[0]} muteado.`)
  }

  if (command === 'unmute') {
    if (!isMuted) return m.reply('⚠️ Este usuario no está muteado.')
    delete chat.mutedUsers[mentioned]
    return m.reply(`✅ Usuario ${mentioned.split('@')[0]} desmuteado.`)
  }
}

handler.command = ['mute', 'unmute']
handler.group = true
handler.tags = ['group']
handler.help = ['mute @usuario', 'unmute @usuario']

// Middleware: eliminar mensajes de usuarios muteados
handler.before = async (m, { conn }) => {
  if (!m.isGroup) return false

  const chat = global.db.data.chats[m.chat]
  if (!chat || !chat.mutedUsers) return false

  const senderId = (m.key.participant || m.sender || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  
  if (chat.mutedUsers[senderId]) {
    try {
      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: m.key.id,
          participant: senderId
        }
      })
    } catch (e) {
      const userTag = `@${senderId.split('@')[0]}`
      await conn.sendMessage(m.chat, {
        text: `⚠️ No pude eliminar el mensaje de ${userTag}. Puede que me falten permisos de admin.`,
        mentions: [senderId]
      })
    }
    return true // Evita que el mensaje siga propagándose
  }

  return false
}

export default handler
