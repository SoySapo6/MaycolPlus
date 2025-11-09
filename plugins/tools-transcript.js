import axios from 'axios'

const handler = async (m, { conn, command, text }) => {
    if (!text) {
        return conn.sendMessage(m.chat, {
            text: `★ Eh? ¿Dónde está la URL? ★\n† Necesito un enlace de YouTube para transcribir †\n\n∘ Uso: *.${command}* <url de YouTube>`,
        }, { quoted: m })
    }

    // Validar que la URL comience con https
    if (!text.startsWith('https://')) {
        return conn.sendMessage(m.chat, {
            text: `★ Oye oye~ ★\n† Solo acepto URLs de YouTube.`,
        }, { quoted: m })
    }

    // Reacción de carga
    await conn.sendMessage(m.chat, {
        react: { text: '⏳', key: m.key }
    })

    try {
        // Hacer petición a la API de transcript
        const response = await axios.get('https://mayapi.ooguy.com/transcript', {
            params: {
                url: text,
                apikey: 'MayHost'
            }
        })

        if (!response.data.status) {
            throw new Error('No se pudo obtener la transcripción')
        }

        const transcriptText = response.data.result.text

        // Mensaje travieso de Hanako-kun con la transcripción
        const hanakoMessage = `★ Jejeje~ Te traje la transcripción ★\n\n┌─────────────────┐\n│ † Transcripción † │\n└─────────────────┘\n\n${transcriptText}\n\n┌────────────────┐\n│ ★ MaycolPlus ★ │\n└────────────────┘`

        // Enviar la transcripción
        await conn.sendMessage(m.chat, {
            text: hanakoMessage
        }, { quoted: m })

        // Reacción de éxito
        await conn.sendMessage(m.chat, {
            react: { text: '✅', key: m.key }
        })

    } catch (error) {
        console.error('Error:', error)
        
        await conn.sendMessage(m.chat, {
            text: `★ Oops~ Algo salió mal ★\n† ${error.message || 'Error desconocido'} †\n\n∘ Verifica que la URL sea válida\n∘ Asegúrate de que el video tenga transcripción`,
        }, { quoted: m })

        await conn.sendMessage(m.chat, {
            react: { text: '❌', key: m.key }
        })
    }
}

handler.help = ['transcript', 'transcribir']
handler.tags = ['tools']
handler.command = /^(transcript|transcribir)$/i

export default handler
