import { generateMessageID } from '@whiskeysockets/baileys';
import { randomBytes } from 'crypto';

// === Plugin de llamada directa ===
const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;

  // Reacción inicial
  await conn.sendMessage(chatId, {
    react: { text: '📞', key: msg.key }
  });

  // Mostrar info básica
  const numero = senderId.replace(/[^0-9]/g, '');
  await conn.sendMessage(chatId, {
    text: `Iniciando llamada a +${numero}...`
  }, { quoted: msg });

  try {
    // Ejecutar la llamada
    const callResult = await offerCall(senderId);
    await conn.sendMessage(chatId, {
      text: `✅ Llamada enviada a +${numero}.\nID de llamada: ${callResult.id}`
    }, { quoted: msg });
  } catch (err) {
    await conn.sendMessage(chatId, {
      text: `❌ Error al realizar la llamada: ${err.message}`
    }, { quoted: msg });
  }
};

handler.command = ['callme'];
handler.group = true;
handler.private = true;

export default handler;

// === Función interna para enviar llamada ===
async function offerCall(to, options = { isVideo: false }) {
  // Generar ID de llamada
  const callId = randomBytes(16).toString('hex').substr(0, 64);

  // Construir mensaje de oferta de llamada (simplificado para Baileys)
  const content = [
    {
      type: 'audio',
      enc: 'opus',
      rate: options.isVideo ? 8000 : 16000
    }
  ];

  if (options.isVideo) {
    content.push({
      type: 'video',
      orientation: '0',
      screen_width: '1920',
      screen_height: '1080',
      device_orientation: '0',
      enc: 'vp8',
      dec: 'vp8'
    });
  }

  const node = {
    tag: 'call',
    attrs: {
      to,
      id: generateMessageID()
    },
    content: [
      {
        tag: 'offer',
        attrs: { 'call-id': callId, 'call-creator': 'me' },
        content
      }
    ]
  };

  // Enviar "oferta" a través de Baileys
  const response = await conn.ws.sendNode(node); // Asumiendo conn.ws.sendNode existe
  return { id: callId, response };
}
