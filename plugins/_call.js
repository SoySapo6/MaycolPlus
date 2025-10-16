import { WPP } from '@wppconnect-team/wppconnect';

export const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;

  // Número al que se realizará la llamada
  const numero = '51987559945'; // Reemplaza con el número deseado

  // Realizar la llamada
  try {
    await WPP.call.offer(numero + '@c.us');
    await conn.sendMessage(chatId, { text: 'Llamada iniciada con éxito.' });
  } catch (error) {
    await conn.sendMessage(chatId, { text: 'Error al realizar la llamada: ' + error.message });
  }
};

handler.command = ['call'];
handler.group = true;
handler.private = false;

export default handler;
