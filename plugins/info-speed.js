import { totalmem, freemem, cpus, platform, arch, release, hostname, uptime, loadavg, networkInterfaces } from 'os'
import os from 'os'
import util from 'util'
import osu from 'node-os-utils'
import { performance } from 'perf_hooks'
import { sizeFormatter } from 'human-readable'
import speed from 'performance-now'
import { spawn, exec, execSync } from 'child_process'
import fs from 'fs'

const format = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`
})

var handler = async (m, { conn }) => {
  let timestamp = speed()
  let latensi = speed() - timestamp

  let _muptime = process.uptime() * 1000
  let muptime = clockString(_muptime)
  
  let _osuptime = uptime() * 1000
  let osuptime = clockString(_osuptime)

  let chats = Object.entries(conn.chats).filter(([id, data]) => id && data.isChats)
  let groups = Object.entries(conn.chats)
    .filter(([jid, chat]) => jid.endsWith('@g.us') && chat.isChats && !chat.metadata?.read_only && !chat.metadata?.announce)
    .map(v => v[0])
  let privateChats = chats.filter(([jid]) => !jid.endsWith('@g.us')).length
  
  const totalMemory = totalmem()
  const freeMemory = freemem()
  const usedMemory = totalMemory - freeMemory
  const memoryUsage = process.memoryUsage()
  
  const cpuInfo = cpus()
  const cpuModel = cpuInfo[0]?.model || 'Desconocido'
  const cpuCores = cpuInfo.length
  const cpuSpeed = cpuInfo[0]?.speed || 0
  
  const osInfo = {
    platform: platform(),
    arch: arch(),
    release: release(),
    hostname: hostname()
  }
  
  const loadAverage = loadavg()
  
  let nodeVersion = process.version
  let v8Version = process.versions.v8
  let nodeEnv = process.env.NODE_ENV || 'desarrollo'
  
  let diskUsage = ''
  try {
    if (platform() === 'linux' || platform() === 'darwin') {
      const df = execSync('df -h /', { encoding: 'utf8' })
      const lines = df.split('\n')[1]?.split(/\s+/)
      if (lines && lines.length >= 4) {
        diskUsage = `→ ◈ Disco: ${lines[2]} usados de ${lines[1]} total (${lines[4]})`
      }
    }
  } catch (error) {
    diskUsage = '→ ◈ Disco: Información no disponible'
  }
  
  let networkInfo = ''
  try {
    const interfaces = networkInterfaces()
    const activeInterfaces = Object.keys(interfaces).filter(name => {
      return interfaces[name].some(iface => !iface.internal && iface.family === 'IPv4')
    })
    networkInfo = activeInterfaces.length > 0 ? activeInterfaces.join(', ') : 'Sin interfaces activas'
  } catch (error) {
    networkInfo = 'Información no disponible'
  }

  const getMemoryPercent = (used, total) => ((used / total) * 100).toFixed(1)
  const getCpuLoadPercent = () => {
    const load1min = loadAverage[0]
    return ((load1min / cpuCores) * 100).toFixed(1)
  }

  let texto = `╭─❍「 ◈ Estado del Sistema ◈ 」
│
├─ ◆ RENDIMIENTO DEL BOT
│
├─ → ◈ Latencia: ${latensi.toFixed(4)} ms
├─ → ◈ Tiempo activo: ${muptime}
├─ → ◈ Ping interno: ${timestamp.toFixed(2)} ms
├─ → ◈ Velocidad procesamiento: ${(1000 / (latensi + 1)).toFixed(0)} req/s
│
├─ ◆ ESTADÍSTICAS DE CHATS
│
├─ → ◈ Total conexiones: ${chats.length}
├─ → ◈ Chats privados: ${privateChats}
├─ → ◈ Grupos activos: ${groups.length}
├─ → ◈ Promedio msgs/chat: ${(chats.length > 0 ? (privateChats + groups.length) / chats.length * 10 : 0).toFixed(1)}
│
├─ ◆ MEMORIA DEL SISTEMA
│
├─ → ◈ RAM total: ${format(totalMemory)}
├─ → ◈ RAM libre: ${format(freeMemory)}
├─ → ◈ RAM usada: ${format(usedMemory)} (${getMemoryPercent(usedMemory, totalMemory)}%)
├─ → ◈ Memoria Node.js: ${format(memoryUsage.heapUsed)}
├─ → ◈ Memoria heap: ${format(memoryUsage.heapTotal)}
├─ → ◈ Memoria externa: ${format(memoryUsage.external)}
├─ → ◈ Buffer memoria: ${format(memoryUsage.arrayBuffers)}
│
├─ ◆ INFORMACIÓN DEL PROCESADOR
│
├─ → ◈ CPU: ${cpuModel}
├─ → ◈ Núcleos: ${cpuCores} cores
├─ → ◈ Velocidad: ${(cpuSpeed / 1000).toFixed(2)} GHz
├─ → ◈ Carga promedio: ${getCpuLoadPercent()}%
├─ → ◈ Load 1min: ${loadAverage[0].toFixed(2)}
├─ → ◈ Load 5min: ${loadAverage[1].toFixed(2)}
├─ → ◈ Load 15min: ${loadAverage[2].toFixed(2)}
│
├─ ◆ SISTEMA OPERATIVO
│
├─ → ◈ Plataforma: ${osInfo.platform}
├─ → ◈ Arquitectura: ${osInfo.arch}
├─ → ◈ Release: ${osInfo.release}
├─ → ◈ Hostname: ${osInfo.hostname}
├─ → ◈ Uptime SO: ${osuptime}
├─ ${diskUsage}
├─ → ◈ Interfaces red: ${networkInfo}
│
├─ ◆ ENTORNO DE DESARROLLO
│
├─ → ◈ Node.js: ${nodeVersion}
├─ → ◈ Motor V8: ${v8Version}
├─ → ◈ Entorno: ${nodeEnv}
├─ → ◈ PID proceso: ${process.pid}
├─ → ◈ Directorio: ${process.cwd()}
├─ → ◈ Usuario: ${process.env.USER || process.env.USERNAME || 'Sistema'}
│
├─ ◆ MÉTRICAS AVANZADAS
│
├─ → ◈ Handles activos: ${process._getActiveHandles().length}
├─ → ◈ Requests activos: ${process._getActiveRequests().length}
├─ → ◈ Event loop lag: ${(performance.now() - timestamp).toFixed(2)} ms
├─ → ◈ GC ejecutado: ${global.gc ? 'Disponible' : 'No disponible'}
│
├─ ◆ ESTADO DE CONEXIÓN
│
├─ → ◈ WebSocket: ${conn.ws?.readyState === 1 ? 'Conectado' : 'Desconectado'}
├─ → ◈ Última actividad: ${new Date().toLocaleString('es-ES')}
├─ → ◈ Zona horaria: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
├─ → ◈ Encoding: ${process.env.LANG || 'UTF-8'}
│
╰─❍「 ◈ Sistema optimizado ◈ 」`

  await m.react('⚡')
  
  setTimeout(async () => {
    await m.react('✅')
  }, 1500)
  
  conn.reply(m.chat, texto.trim(), m)
}

handler.help = ['speed', 'status', 'info', 'ping', 'system']
handler.tags = ['info']
handler.command = ['speed', 'status', 'info', 'ping', 'system']
handler.register = false

export default handler

function clockString(ms) {
  let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000)
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [
    d > 0 ? d + 'd ' : '',
    h.toString().padStart(2, 0) + 'h ',
    m.toString().padStart(2, 0) + 'm ',
    s.toString().padStart(2, 0) + 's'
  ].join('').trim()
}
