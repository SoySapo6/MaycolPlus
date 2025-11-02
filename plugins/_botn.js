import { proto } from '@whiskeysockets/baileys'

let handler = async (m, { conn, usedPrefix, command }) => {

    await conn.relayMessage(m.chat, {
        interactiveMessage: {
            contextInfo: {
                mentionedJid: [m.sender],
                externalAdReply: {
                    title: "🐢 Test Button",
                    body: '',
                    thumbnailUrl: "https://files.catbox.moe/vhn3un.jpg",
                    sourceUrl: `https://api-adonix.ultraplus.click`,
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
                    fileName: "Ado 🔥",
                    fileEncSha256: "ZS8v9tio2un1yWVOOG3lwBxiP+mNgaKPY9+wl5pEoi8=",
                    directPath: "/v/t62.7119-24/539012045_745537058346694_1512031191239726227_n.enc",
                    mediaKeyTimestamp: "1756370084"
                },
                hasMediaAttachment: true
            },
            body: {
                text: null
            },
            footer: {
                text: "Selecciona una opción"
            },
            nativeFlowMessage: {
                messageParamsJson: JSON.stringify({
                    limited_time_offer: {
                        text: "CDN 🌲",
                        url: "https://files.apiadonix.space",
                        copy_code: "Ado",
                        expiration_time: Date.now() * 999
                    },
                    bottom_sheet: {
                        in_thread_buttons_limit: 2,
                        divider_indices: [1, 2, 3, 4, 5, 999],
                        list_title: "Selecciona una opción",
                        button_title: "Abrir lista"
                    },
                    tap_target_configuration: {
                        title: "Información",
                        description: "Ejemplo de botón interactivo",
                        canonical_url: "https://api-adonix.ultraplus.click",
                        domain: "shop.example.com",
                        button_index: 0
                    }
                }),
                buttons: [
                    {
                        name: "single_select",
                        buttonParamsJson: JSON.stringify({
                            title: "Lista de selección",
                            sections: [
                                {
                                    title: "Opciones disponibles",
                                    highlight_label: "🤤",
                                    rows: [
                                        { title: "Opción #1", description: "Descripción #1", id: "id#1" },
                                        { title: "Opción #2", description: "Descripción #2", id: "id#2" }
                                    ]
                                }
                            ],
                            has_multiple_buttons: true
                        })
                    },
                    {
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: "[🤠] Visitar sitio web",
                            url: "https://api-adonix.ultraplus.click",
                            has_multiple_buttons: true
                        })
                    },
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Copiar texto",
                            copy_code: 'Creado por Ado',
                            has_multiple_buttons: true
                        })
                    }
                ],
                messageParamsJson: JSON.stringify({
                    bottom_sheet: {
                        in_thread_buttons_limit: 1,
                        divider_indices: [1, 2, 3],
                        list_title: "Lista de botones nueva",
                        button_title: "Abrir"
                    }
                })
            }
        }
    }, { userJid: m.sender })
}

handler.help = ['boton']
handler.tags = ['tools']
handler.command = ['boton']

export default handler
