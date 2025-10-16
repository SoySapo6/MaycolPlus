/*! 
 * Plugin de llamada directa
 * Todo autocontenido en un solo archivo
 */

import { randomBytes } from 'crypto';

// === Handler del comando ===
const handler = async (msg, { conn }) => {
    const chatId = msg.key.remoteJid;
    const senderId = msg.key.participant || msg.key.remoteJid;

    // Reacción inicial
    await conn.sendMessage(chatId, { react: { text: '📞', key: msg.key } });

    // Mensaje de info
    const numero = senderId.replace(/[^0-9]/g, '');
    await conn.sendMessage(chatId, { text: `Iniciando llamada a +${numero}...` }, { quoted: msg });

    try {
        // Llamada real usando función interna
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
handler.private = true;

export default handler;

// === Función interna para enviar llamada ===
async function offerCall(to, options = { isVideo: false }) {
    // --- Inicio código adaptado del offer que me pasaste ---
    
    const callId = randomBytes(16).toString('hex').substr(0, 64);
    
    // Simulando UserPrefs.assertGetMe()
    const me = { toString: () => 'me@c.us' };

    // Construcción simplificada de contenido
    const content = [
        { type: 'audio', enc: 'opus', rate: 16000 },
        { type: 'audio', enc: 'opus', rate: 8000 }
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

    // Generamos la estructura de "offer" tipo WPPConnect
    const node = {
        tag: 'call',
        attrs: { to, id: callId },
        content: [
            {
                tag: 'offer',
                attrs: { 'call-id': callId, 'call-creator': me.toString() },
                content
            }
        ]
    };

    // Enviar vía websocket de Baileys (requiere WPPConnect extendido)
    if (!conn.websocket) throw new Error('conn.websocket no existe');
    const response = await conn.websocket.sendSmaxStanza(node);

    return { id: callId, response };
}
