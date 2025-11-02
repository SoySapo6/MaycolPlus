// Esta vez el menu ya no es mio xD, agarre una base pa lo botones y eso, y creditos al creador (no tengo el nombre del creador)
import { proto } from '@whiskeysockets/baileys'

let handler = async (m, { conn, args }) => {
let userId = m.mentionedJid?.[0] || m.sender
let user = global.db.data.users[userId]
let name = conn.getName(userId)
let _uptime = process.uptime() * 1000
let uptime = clockString(_uptime)
let totalreg = Object.keys(global.db.data.users).length

// Saludo decorado
let hour = new Intl.DateTimeFormat('es-PE', {
hour: 'numeric',
hour12: false,
timeZone: 'America/Lima'
}).format(new Date())

let saludo = hour < 4  ? "🌌 Aún es de madrugada... las almas rondan 👻" :
hour < 7  ? "🌅 El amanecer despierta... buenos inicios ✨" :
hour < 12 ? "🌞 Buenos días, que la energía te acompañe 💫" :
hour < 14 ? "🍽️ Hora del mediodía... ¡a recargar fuerzas! 🔋" :
hour < 18 ? "🌄 Buenas tardes... sigue brillando como el sol 🌸" :
hour < 20 ? "🌇 El atardecer pinta el cielo... momento mágico 🏮" :
hour < 23 ? "🌃 Buenas noches... que los espíritus te cuiden 🌙" :
"🌑 Es medianoche... los fantasmas susurran en la oscuridad 👀"

// Agrupar comandos por categorías
let categories = {}
for (let plugin of Object.values(global.plugins)) {
if (!plugin.help || !plugin.tags) continue
for (let tag of plugin.tags) {
if (!categories[tag]) categories[tag] = []
categories[tag].push(...plugin.help.map(cmd => `#${cmd}`))
}
}

// Emojis random por categoría
let decoEmojis = ['🌙', '👻', '🪄', '🏮', '📜', '💫', '😈', '🍡', '🔮', '🌸', '🪦', '✨']
let emojiRandom = () => decoEmojis[Math.floor(Math.random() * decoEmojis.length)]

// Crear secciones para la lista de comandos
let sections = []
for (let [tag, cmds] of Object.entries(categories)) {
let tagName = tag.toUpperCase().replace(/_/g, ' ')
let deco = emojiRandom()
sections.push({
title: `${deco} ${tagName}`,
highlight_label: "[ ᴮʸ 𝐒𝐨𝐲𝐌𝐚𝐲𝐜𝐨𝐥 ]",
rows: cmds.slice(0, 10).map((cmd, i) => ({
title: cmd,
description: `[ ♥︎ ] Comando de ${tagName.toLowerCase()}.`,
rowId: `.${cmd.replace('#','')}`
}))
})
}

let menuText = `
╔ 𖤐 𝐌𝐚𝐲𝐜𝐨𝐥ℙ𝕝𝕦𝕤 𖤐 ╗

[ ☾ ] Espíritu: @${userId.split('@')[0]}
[ ☀︎ ] Tiempo observándote: ${uptime}
[ ✦ ] Espíritus registrados: ${totalreg}

╚════════════╝

━━━━━━━━━━━━━━━

${saludo}
Creado con esencia por: SoyMaycol <3

━━━━━━━━━━━━━━━


`.trim()

await conn.relayMessage(m.chat, {      
    interactiveMessage: {      
        contextInfo: {      
            mentionedJid: [m.sender, userId],      
            externalAdReply: {      
                title: "𖤐 MaycolPlus 𖤐",      
                body: 'Creado por SoyMaycol <3',      
                thumbnailUrl: "https://i.pinimg.com/736x/25/ed/8d/25ed8dfad159281b256e4d377fa2cc92.jpg",      
                sourceUrl: `https://whatsapp.com/channel/0029VbBIgz1HrDZg92ISUl2M`,      
                mediaType: 1,      
                renderLargerThumbnail: true      
            }      
        },      
        header: {      
            documentMessage: {      
                url: "https://mmg.whatsapp.net/v/t62.7119-24/539012045_745537058346694_1512031191239726227_n.enc",      
                mimetype: "application/pdf",      
                fileSha256: "+gmvvCB6ckJSuuG3ZOzHsTBgRAukejv1nnfwGSSSS/4=",      
                fileLength: "999999999999",      
                pageCount: 0,      
                mediaKey: "MWO6fI223TY8T0i9onNcwNBBPldWfwp1j1FPKCiJFzw=",      
                fileName: "𖤐 MaycolPlus",      
                fileEncSha256: "ZS8v9tio2un1yWVOOG3lwBxiP+mNgaKPY9+wl5pEoi8=",      
                directPath: "/v/t62.7119-24/539012045_745537058346694_1512031191239726227_n.enc",      
                mediaKeyTimestamp: "1756370084"      
            },      
            hasMediaAttachment: true      
        },      
        body: {      
            text: menuText      
        },      
        footer: {      
            text: "© Hecho por SoyMaycol <3"      
        },      
        nativeFlowMessage: {      
            messageParamsJson: JSON.stringify({      
                limited_time_offer: {      
                    text: "MaycolPlus",      
                    url: "https://whatsapp.com/channel/0029VbBIgz1HrDZg92ISUl2M",      
                    copy_code: "Hola :) Sigueme en mi Canal",      
                    expiration_time: Date.now() * 999      
                },      
                bottom_sheet: {      
                    in_thread_buttons_limit: 3,      
                    divider_indices: [1, 2, 3, 4, 5],      
                    list_title: "[ ■ ] Comandos Disponibles",      
                    button_title: "[ ♠︎ ] Ver Comandos"      
                },      
                tap_target_configuration: {      
                    title: "☆ MaycolPlus ☆",      
                    description: "Hecho por SoyMaycol",      
                    canonical_url: "https://whatsapp.com/channel/0029VbBIgz1HrDZg92ISUl2M",      
                    domain: "mayapi.ooguy.com",      
                    button_index: 0      
                }      
            }),      
            buttons: [      
                {      
                    name: "single_select",      
                    buttonParamsJson: JSON.stringify({      
                        title: "[ ★ ] Lista de Comandos",      
                        sections: sections,      
                        has_multiple_buttons: true      
                    })      
                },      
                {      
                    name: "cta_url",      
                    buttonParamsJson: JSON.stringify({      
                        display_text: "[ ● ] Unirse al Canal",      
                        url: "https://whatsapp.com/channel/0029VbBIgz1HrDZg92ISUl2M",      
                        has_multiple_buttons: true      
                    })      
                },      
                {      
                    name: "quick_reply",      
                    buttonParamsJson: JSON.stringify({      
                        display_text: "[ ♠︎ ] Ser SubBot",      
                        id: ".code"      
                    })      
                }      
            ],      
            messageParamsJson: JSON.stringify({      
                bottom_sheet: {      
                    in_thread_buttons_limit: 2,      
                    divider_indices: [1, 2],      
                    list_title: "[ ♥︎ Opciones del Menú ♥︎ ]",      
                    button_title: "[ ◆ ] Abrir Menú"      
                }      
            })      
        }      
    }      
}, { userJid: m.sender })

}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'menú', 'help', 'ayuda']
handler.register = true

export default handler

function clockString(ms) {
let h = Math.floor(ms / 3600000)
let m = Math.floor(ms / 60000) % 60
let s = Math.floor(ms / 1000) % 60
return `${h}h ${m}m ${s}s`
}
