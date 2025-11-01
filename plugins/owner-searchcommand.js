import fs from 'fs'
import path from 'path'

let handler = async (m, { text, usedPrefix, command }) => {
  if (!text) return m.reply(`⚠️ Usa: *${usedPrefix + command} <nombre del comando>*`)

  const pluginsPath = './plugins'
  const files = fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'))
  let encontrados = []

  for (const file of files) {
    const filePath = path.join(pluginsPath, file)
    const content = fs.readFileSync(filePath, 'utf8')

    // Detecta comandos definidos como array o regex
    const cmdArrayMatch = content.match(/handler\.command\s*=\s*(?:\[[^\]]+\]|\/.*?\/[gimsuy]*)/s)

    if (cmdArrayMatch) {
      const comandos = cmdArrayMatch[0]

      // Busca el texto dentro del array o regex
      const regex = new RegExp(`['"\`]?\\b${text}\\b['"\`]?(?=[,\\] /])`, 'i')
      if (regex.test(comandos)) {
        encontrados.push(file)
      }
    }
  }

  if (encontrados.length === 0) {
    return m.reply(`❌ No se encontró ningún comando llamado *${text}*.`)
  }

  const respuesta = `
📂 *Resultado de búsqueda:*
🔍 Comando: ${text}

🧩 Archivos encontrados:
${encontrados.map(f => '• ' + f).join('\n')}
`.trim()

  return m.reply(respuesta)
}

handler.command = /^searchcommand$/i
handler.help = ['searchcommand <comando>']
handler.tags = ['owner']
handler.rowner = true

export default handler
