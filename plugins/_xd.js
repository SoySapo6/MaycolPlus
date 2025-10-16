import fs from "fs";
import path from "path";

const DB_PATH = path.join(".", "database", "doros.json");

function loadDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, "[]");
    }
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw || "[]");
  } catch (e) {
    return [];
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function nowPeru() {
  const d = new Date();
  const s = d.toLocaleString("en-US", { timeZone: "America/Lima" });
  return new Date(s);
}

function formatMention(jid) {
  if (!jid) return "";
  const clean = jid.split("@")[0];
  return `@${clean}`;
}

function randomChance(p) {
  return Math.random() < p;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

const ACTION_IMAGES = {
  bag: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/doro%20en%20una%20bolsa%20de%20doritos.jpeg",
  sleeping: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/doro%20durmiendo.jpg",
  phone: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/doro%20con%20el%20celular.jpeg",
  eating: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/doro%20comienzo.jpeg",
  friend: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/Doro%20haciendo%20un%20amigo.jpeg",
  fall: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/Doro%20Cay%C3%A9ndose%20en%20el%20Piso.jpeg",
  annoying: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/las%20mascotas%20de%20otros%20molestos%20contigo.jpeg"
};

function createEmptyDoro(ownerJid, name) {
  const t = nowPeru().toISOString();
  return {
    owner: ownerJid,
    name,
    createdAt: t,
    stats: {
      health: 100,
      hunger: 0,
      happiness: 80,
      energy: 100
    },
    xp: 0,
    level: 1,
    friends: [],
    achievements: [],
    logs: [],
    pendingRequests: [], // incoming friend requests { fromOwner, fromDoroName, at }
    lastSleep: null,
    lastFed: null,
    lastPlayed: null
  };
}

function xpForNext(level) {
  return 50 + level * 30;
}

function addLog(doro, text) {
  doro.logs.unshift({ at: nowPeru().toISOString(), text });
  if (doro.logs.length > 50) doro.logs.pop();
}

function pushAchievement(doro, key, title) {
  if (!doro.achievements.find(a => a.key === key)) {
    doro.achievements.push({ key, title, at: nowPeru().toISOString() });
  }
}

function findDoroByName(db, name) {
  return db.find(x => x.name.toLowerCase() === name.toLowerCase());
}

const handler = async (m, { conn, text, command }) => {
  const db = loadDB();
  const from = m.sender;
  const args = (text || "").trim().split(/\s+/).filter(Boolean);
  const sub = args.shift ? args.shift().toLowerCase() : "";
  const mention = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null;
  const userTag = formatMention(from);

  if (["create", "setname"].includes(sub)) {
    const name = args.join(" ");
    if (!name) return conn.sendMessage(m.chat, { text: `Debes dar un nombre: \nUso: .doro create <nombre>` }, { quoted: m });
    if (findDoroByName(db, name)) return conn.sendMessage(m.chat, { text: `Ese nombre ya fue reclamado. Intenta otro.` }, { quoted: m });
    const newDoro = createEmptyDoro(from, name);
    db.push(newDoro);
    saveDB(db);
    addLog(newDoro, `${userTag} creó a ${name}.`);
    await conn.sendMessage(m.chat, { image: { url: ACTION_IMAGES.bag }, caption: `╭─❍「 ✦ MaycolPlus ✦ 」\n├─ ¡Tu Doro fue creado! 🐶💖\n├─ Nombre: ${name}\n├─ Dueño: ${userTag}\n╰─✦` }, { quoted: m });
    return;
  }

  if (sub === "profile") {
    const name = args.join(" ");
    if (!name) return conn.sendMessage(m.chat, { text: `Uso: .doro profile <nombre>` }, { quoted: m });
    const d = findDoroByName(db, name);
    if (!d) return conn.sendMessage(m.chat, { text: `No existe un Doro llamado ${name}` }, { quoted: m });
    const ownerTag = formatMention(d.owner);
    const stats = d.stats;
    const achList = d.achievements.length ? d.achievements.map(a => `• ${a.title}`).join("\n") : "—";
    const friends = d.friends.length ? d.friends.map(f => `${f.name} (${formatMention(f.owner)})`).join("\n") : "—";
    const msg = `╭─❍「 ✦ Perfil de ${d.name} ✦ 」\n├─ Dueño: ${ownerTag}\n├─ Nivel: ${d.level} (XP ${d.xp}/${xpForNext(d.level)})\n├─ Salud: ${stats.health}\n├─ Hambre: ${stats.hunger}\n├─ Felicidad: ${stats.happiness}\n├─ Energía: ${stats.energy}\n├─ Amigos:\n${friends}\n├─ Logros:\n${achList}\n╰─✦`;
    await conn.sendMessage(m.chat, { text: msg, mentions: [d.owner] }, { quoted: m });
    return;
  }

  if (sub === "feed") {
    const name = args.join(" ");
    if (!name) return conn.sendMessage(m.chat, { text: `Uso: .doro feed <nombre>` }, { quoted: m });
    const d = findDoroByName(db, name);
    if (!d) return conn.sendMessage(m.chat, { text: `No existe ${name}` }, { quoted: m });
    if (d.owner !== from) return conn.sendMessage(m.chat, { text: `Solo el dueño puede alimentar a ${name}` }, { quoted: m });
    d.stats.hunger = clamp(d.stats.hunger - 25, 0, 100);
    d.stats.health = clamp(d.stats.health + 8, 0, 100);
    d.xp += 8;
    d.lastFed = nowPeru().toISOString();
    addLog(d, `${userTag} alimentó a ${d.name}`);
    if (d.xp >= xpForNext(d.level)) { d.xp -= xpForNext(d.level); d.level++; pushAchievement(d, `lvl${d.level}`, `Alcanzó nivel ${d.level}`); }
    saveDB(db);
    await conn.sendMessage(m.chat, { image: { url: ACTION_IMAGES.eating }, caption: `╭─❍「 ✦ MaycolPlus ✦ 」\n├─ ${d.name} comió rico 🍽️\n├─ Salud: ${d.stats.health}\n├─ Hambre: ${d.stats.hunger}\n╰─✦` }, { quoted: m });
    return;
  }

  if (sub === "sleep") {
    const name = args.join(" ");
    if (!name) return conn.sendMessage(m.chat, { text: `Uso: .doro sleep <nombre>` }, { quoted: m });
    const d = findDoroByName(db, name);
    if (!d) return conn.sendMessage(m.chat, { text: `No existe ${name}` }, { quoted: m });
    if (d.owner !== from) return conn.sendMessage(m.chat, { text: `Solo el dueño puede dormir a ${name}` }, { quoted: m });
    const hour = nowPeru().getHours();
    d.lastSleep = nowPeru().toISOString();
    d.stats.energy = clamp(d.stats.energy + 50, 0, 100);
    d.stats.health = clamp(d.stats.health + 10, 0, 100);
    d.xp += 6;
    addLog(d, `${userTag} puso a dormir a ${d.name}`);
    if (d.xp >= xpForNext(d.level)) { d.xp -= xpForNext(d.level); d.level++; pushAchievement(d, `lvl${d.level}`, `Alcanzó nivel ${d.level}`); }
    saveDB(db);
    await conn.sendMessage(m.chat, { image: { url: ACTION_IMAGES.sleeping }, caption: `╭─❍「 ✦ MaycolPlus ✦ 」\n├─ ${d.name} se durmió 💤\n├─ Energía: ${d.stats.energy}\n├─ Salud: ${d.stats.health}\n╰─✦` }, { quoted: m });
    return;
  }

  if (sub === "play") {
    const name = args.join(" ");
    if (!name) return conn.sendMessage(m.chat, { text: `Uso: .doro play <nombre>` }, { quoted: m });
    const d = findDoroByName(db, name);
    if (!d) return conn.sendMessage(m.chat, { text: `No existe ${name}` }, { quoted: m });
    if (d.owner !== from) return conn.sendMessage(m.chat, { text: `Solo el dueño puede jugar con ${name}` }, { quoted: m });
    if (d.stats.energy < 15) {
      d.stats.happiness = clamp(d.stats.happiness - 5, 0, 100);
      addLog(d, `${d.name} está muy cansada para jugar.`);
      saveDB(db);
      return conn.sendMessage(m.chat, { text: `${d.name} está cansada, necesita dormir primero.` }, { quoted: m });
    }
    d.stats.energy = clamp(d.stats.energy - 20, 0, 100);
    d.stats.hunger = clamp(d.stats.hunger + 10, 0, 100);
    d.stats.happiness = clamp(d.stats.happiness + 12, 0, 100);
    d.xp += 12;
    d.lastPlayed = nowPeru().toISOString();
    addLog(d, `${userTag} jugó con ${d.name}`);
    if (d.xp >= xpForNext(d.level)) { d.xp -= xpForNext(d.level); d.level++; pushAchievement(d, `lvl${d.level}`, `Alcanzó nivel ${d.level}`); }
    saveDB(db);
    await conn.sendMessage(m.chat, { image: { url: ACTION_IMAGES.phone }, caption: `╭─❍「 ✦ MaycolPlus ✦ 」\n├─ ${d.name} jugó y se divirtió 🎮\n├─ Felicidad: ${d.stats.happiness}\n├─ Energía: ${d.stats.energy}\n╰─✦` }, { quoted: m });
    return;
  }

  if (sub === "addfriend" || sub === "friend") {
    const targetName = args.join(" ");
    if (!targetName) return conn.sendMessage(m.chat, { text: `Uso: .doro addfriend <nombre_de_mascota_de_otro>` }, { quoted: m });
    const myDoro = db.find(x => x.owner === from);
    if (!myDoro) return conn.sendMessage(m.chat, { text: `Primero debes tener un Doro. Crea uno con .doro create <nombre>` }, { quoted: m });
    const target = findDoroByName(db, targetName);
    if (!target) return conn.sendMessage(m.chat, { text: `No existe ${targetName}` }, { quoted: m });
    if (target.owner === from) return conn.sendMessage(m.chat, { text: `No puedes enviar solicitud a tu propio Doro.` }, { quoted: m });
    if (target.friends.find(f => f.name.toLowerCase() === myDoro.name.toLowerCase())) return conn.sendMessage(m.chat, { text: `${targetName} ya es amigo de ${myDoro.name}` }, { quoted: m });
    target.pendingRequests.push({ fromOwner: from, fromDoroName: myDoro.name, at: nowPeru().toISOString() });
    addLog(target, `${formatMention(from)} envió una solicitud de amistad.`);
    saveDB(db);
    await conn.sendMessage(m.chat, { image: { url: ACTION_IMAGES.friend }, caption: `╭─❍「 ✦ MaycolPlus ✦ 」\n├─ Solicitud enviada a ${targetName} ✅\n├─ Su dueño deberá aceptar con: .doro accept ${targetName} @${target.owner.split("@")[0]}\n╰─✦` }, { quoted: m });
    return;
  }

  if (sub === "accept") {
    const targetName = args.shift();
    const mentionJid = mention;
    if (!targetName || !mentionJid) return conn.sendMessage(m.chat, { text: `Uso: .doro accept <tu_nombre_de_doro> @dueño_del_otro` }, { quoted: m });
    const myDoro = findDoroByName(db, targetName);
    if (!myDoro) return conn.sendMessage(m.chat, { text: `No tienes un Doro llamado ${targetName}` }, { quoted: m });
    if (myDoro.owner !== from) return conn.sendMessage(m.chat, { text: `Solo el dueño puede aceptar solicitudes.` }, { quoted: m });
    const requester = db.find(x => x.owner === mentionJid);
    if (!requester) return conn.sendMessage(m.chat, { text: `El dueño mencionado no tiene Doro` }, { quoted: m });
    const pending = myDoro.pendingRequests.find(r => r.fromOwner === requester.owner);
    if (!pending) return conn.sendMessage(m.chat, { text: `No hay solicitudes de ese dueño.` }, { quoted: m });
    myDoro.pendingRequests = myDoro.pendingRequests.filter(r => r.fromOwner !== requester.owner);
    myDoro.friends.push({ owner: requester.owner, name: pending.fromDoroName });
    const fromDoro = requester.friends // ensure mutual
    const reqFromDoro = requester;
    const theirDoro = requester; // requester holds owner and their pets, but names unique so find by name
    const reqPet = findDoroByName(db, pending.fromDoroName);
    if (reqPet && !reqPet.friends.find(f => f.name === myDoro.name && f.owner === myDoro.owner)) {
      reqPet.friends.push({ owner: myDoro.owner, name: myDoro.name });
    }
    addLog(myDoro, `${formatMention(requester.owner)} se hizo amigo de ${myDoro.name}`);
    saveDB(db);
    await conn.sendMessage(m.chat, { text: `${myDoro.name} ahora es amigo de ${pending.fromDoroName}` }, { quoted: m, mentions: [requester.owner] });
    return;
  }

  if (sub === "achievements" || sub === "logros") {
    const name = args.join(" ");
    if (!name) return conn.sendMessage(m.chat, { text: `Uso: .doro achievements <nombre>` }, { quoted: m });
    const d = findDoroByName(db, name);
    if (!d) return conn.sendMessage(m.chat, { text: `No existe ${name}` }, { quoted: m });
    const list = d.achievements.length ? d.achievements.map(a => `• ${a.title} (${a.at.split("T")[0]})`).join("\n") : "—";
    await conn.sendMessage(m.chat, { text: `Logros de ${d.name}:\n${list}` }, { quoted: m });
    return;
  }

  if (sub === "friends" || sub === "amigos") {
    const name = args.join(" ");
    if (!name) return conn.sendMessage(m.chat, { text: `Uso: .doro friends <nombre>` }, { quoted: m });
    const d = findDoroByName(db, name);
    if (!d) return conn.sendMessage(m.chat, { text: `No existe ${name}` }, { quoted: m });
    const list = d.friends.length ? d.friends.map(f => `• ${f.name} (${formatMention(f.owner)})`).join("\n") : "—";
    await conn.sendMessage(m.chat, { text: `Amigos de ${d.name}:\n${list}` }, { quoted: m });
    return;
  }

  if (sub === "top") {
    const sorted = db.slice().sort((a,b) => (b.stats.health + b.stats.happiness) - (a.stats.health + a.stats.happiness)).slice(0,10);
    const lines = sorted.map((d,i) => `${i+1}. ${d.name} (${formatMention(d.owner)}) - Salud:${d.stats.health} Felicidad:${d.stats.happiness}`);
    await conn.sendMessage(m.chat, { text: `Top mascotas:\n${lines.join("\n")}` }, { quoted: m });
    return;
  }

  if (sub === "events") {
    const name = args.join(" ");
    if (!name) return conn.sendMessage(m.chat, { text: `Uso: .doro events <nombre>` }, { quoted: m });
    const d = findDoroByName(db, name);
    if (!d) return conn.sendMessage(m.chat, { text: `No existe ${name}` }, { quoted: m });
    const logs = d.logs.slice(0,10).map(l => `${l.at.split("T")[0]} - ${l.text}`).join("\n") || "—";
    await conn.sendMessage(m.chat, { text: `Últimos sucesos de ${d.name}:\n${logs}` }, { quoted: m });
    return;
  }

  if (sub === "help" || sub === "ayuda") {
    const textHelp = `Comandos Doro:
.doro create <nombre>
.doro profile <nombre>
.doro feed <nombre>
.doro sleep <nombre>
.doro play <nombre>
.doro addfriend <nombre_otro>
.doro accept <tu_nombre> @dueño_del_otro
.doro friends <nombre>
.doro achievements <nombre>
.doro events <nombre>
.doro top
Nota: El nombre de la mascota debe ser único.`;
    return conn.sendMessage(m.chat, { text: textHelp }, { quoted: m });
  }

  // Si no coincide ningún subcomando, usamos interacción general y posible evento aleatorio
  const globalDoro = db.find(x => x.owner === from);
  if (!globalDoro) return conn.sendMessage(m.chat, { text: `Tienes que tener un Doro para usar comandos generales. Crea uno: .doro create <nombre>` }, { quoted: m });

  // Evento nocturno: si es noche (23-6) y el doro no durmió -> advertencia, si se ignora se desmaya
  const hour = nowPeru().getHours();
  if (hour >= 23 || hour <= 6) {
    const lastSleepOk = globalDoro.lastSleep ? (new Date(globalDoro.lastSleep).getTime() > Date.now() - 1000*60*60*6) : false;
    if (!lastSleepOk) {
      if (!globalDoro.__warnedAt || (Date.now() - globalDoro.__warnedAt > 1000*60*30)) {
        globalDoro.__warnedAt = Date.now();
        addLog(globalDoro, `Se le advirtió al dueño que es de noche.`);
        saveDB(db);
        await conn.sendMessage(m.chat, { text: `╭─❍「 ✦ MaycolPlus ✦ 」\n├─ ${globalDoro.name} debería dormir (es de noche en Perú). Si no duerme, puede desmayarse.\n╰─✦` }, { quoted: m });
        return;
      } else {
        // si ya avisado y aún no duerme -> se desmaya
        globalDoro.stats.energy = 5;
        globalDoro.stats.health = clamp(globalDoro.stats.health - 30, 0, 100);
        addLog(globalDoro, `${globalDoro.name} se desmayó por falta de sueño.`);
        saveDB(db);
        await conn.sendMessage(m.chat, { image: { url: ACTION_IMAGES.fall }, caption: `╭─❍「 ✦ MaycolPlus ✦ 」\n├─ ${globalDoro.name} se desmayó 😵\n├─ Salud muy baja: ${globalDoro.stats.health}\n╰─✦` }, { quoted: m });
        return;
      }
    }
  }

  // Sucesos aleatorios cada interacción (pequeña chance)
  let triggered = false;
  if (randomChance(0.12)) {
    const eventRoll = Math.random();
    if (eventRoll < 0.25) {
      globalDoro.stats.happiness = clamp(globalDoro.stats.happiness + 10, 0, 100);
      addLog(globalDoro, `Tu Doro encontró un amiguito en el parque.`);
      saveDB(db);
      await conn.sendMessage(m.chat, { image: { url: ACTION_IMAGES.friend }, caption: `╭─❍「 ✦ Evento ✦ 」\n├─ ${globalDoro.name} se hizo un nuevo amigo 😺\n╰─✦` }, { quoted: m });
      triggered = true;
    } else if (eventRoll < 0.5) {
      globalDoro.stats.hunger = clamp(globalDoro.stats.hunger + 20, 0, 100);
      addLog(globalDoro, `Comió un snack y ahora tiene hambre otra vez.`);
      saveDB(db);
      await conn.sendMessage(m.chat, { image: { url: ACTION_IMAGES.eating }, caption: `╭─❍「 ✦ Evento ✦ 」\n├─ ${globalDoro.name} encontró comida 🍟\n╰─✦` }, { quoted: m });
      triggered = true;
    } else if (eventRoll < 0.75) {
      globalDoro.stats.health = clamp(globalDoro.stats.health - 10, 0, 100);
      addLog(globalDoro, `Se tropezó y se lastimó un poco.`);
      saveDB(db);
      await conn.sendMessage(m.chat, { image: { url: ACTION_IMAGES.fall }, caption: `╭─❍「 ✦ Evento ✦ 」\n├─ ${globalDoro.name} se tropezó 😅\n├─ Salud: ${globalDoro.stats.health}\n╰─✦` }, { quoted: m });
      triggered = true;
    } else {
      globalDoro.stats.happiness = clamp(globalDoro.stats.happiness - 10, 0, 100);
      addLog(globalDoro, `Se peleó con otra mascota y está molesta.`);
      saveDB(db);
      await conn.sendMessage(m.chat, { image: { url: ACTION_IMAGES.annoying }, caption: `╭─❍「 ✦ Evento ✦ 」\n├─ ${globalDoro.name} se peleó con otra mascota 😤\n╰─✦` }, { quoted: m });
      triggered = true;
    }
  }

  if (!triggered) {
    // Interacción por defecto: resumen rápido de estado
    addLog(globalDoro, `${userTag} revisó a ${globalDoro.name}`);
    saveDB(db);
    await conn.sendMessage(m.chat, { text: `╭─❍「 ✦ Estado rapido ✦ 」\n├─ ${globalDoro.name}\n├─ Salud: ${globalDoro.stats.health}\n├─ Hambre: ${globalDoro.stats.hunger}\n├─ Energía: ${globalDoro.stats.energy}\n├─ Felicidad: ${globalDoro.stats.happiness}\n╰─✦` }, { quoted: m });
  }
};

handler.command = ["doro"];
handler.help = ["doro <subcomando>"];
handler.tags = ["diversion"];
handler.register = true;

export default handler;
