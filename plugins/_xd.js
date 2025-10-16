import fs from 'fs/promises';

const doroImages = [
  { action: "eating", url: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/doro%20en%20una%20bolsa%20de%20doritos.jpeg" },
  { action: "sleeping", url: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/doro%20durmiendo.jpg" },
  { action: "playing", url: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/doro%20con%20el%20celular.jpeg" },
  { action: "new_friend", url: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/Doro%20haciendo%20un%20amigo.jpeg" },
  { action: "fallen", url: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/Doro%20Cay%C3%A9ndose%20en%20el%20Piso.jpeg" },
  { action: "annoying", url: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/las%20mascotas%20de%20otros%20molestos%20contigo.jpeg" },
  { action: "sick", url: "https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/Doro%20Cay%C3%A9ndose%20en%20el%20Piso.jpeg"}
];

const dbPath = './database/doros.json';
const COOLDOWN = 60 * 60 * 1000; // 1 hour
const XP_PER_LEVEL = 100;

const achievements = {
  "social_butterfly": { name: "Mariposa Social", description: "Consigue 10 amigos.", goal: 10 },
  "xp_master": { name: "Maestro de XP", description: "Alcanza 1000 XP.", goal: 1000 }
};

const getRandomImage = (action) => {
  const images = doroImages.filter(img => img.action === action);
  if (images.length === 0) return doroImages.find(img => img.action === 'fallen').url;
  return images[Math.floor(Math.random() * images.length)].url;
};

const readDb = async () => {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return [];
    }
    console.error("Failed to read or parse doros.json:", e);
    return [];
  }
};

const saveDb = async (data) => {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};

const checkLevelUp = (doro, conn) => {
    let changed = false;
    while (doro.xp >= doro.level * XP_PER_LEVEL) {
        doro.level++;
        doro.health = 100;
        doro.happiness = 100;
        conn.sendMessage(doro.owner, { text: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡Felicidades! Tu Doro ${doro.name} ha subido al nivel ${doro.level}.\n│\n╰─✦` });
        changed = true;
    }
    return changed;
}

const checkAchievements = (doro, conn) => {
  let changed = false;
  if (doro.friends.length >= achievements.social_butterfly.goal && !doro.achievements.includes("social_butterfly")) {
    doro.achievements.push("social_butterfly");
    conn.sendMessage(doro.owner, { text: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡Tu Doro ${doro.name} ha ganado el logro "${achievements.social_butterfly.name}"!\n│\n╰─✦` });
    changed = true;
  }
  if (doro.xp >= achievements.xp_master.goal && !doro.achievements.includes("xp_master")) {
    doro.achievements.push("xp_master");
    conn.sendMessage(doro.owner, { text: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡Tu Doro ${doro.name} ha ganado el logro "${achievements.xp_master.name}"!\n│\n╰─✦` });
    changed = true;
  }
  return changed;
};

const handleRandomEvents = (doro, conn) => {
    const chance = Math.random();
    if (chance < 0.1) {
        doro.health = Math.max(0, doro.health - 20);
        doro.isSick = true;
        const sickImg = getRandomImage('sick');
        conn.sendMessage(doro.owner, { image: { url: sickImg }, caption: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡Oh no! Tu Doro ${doro.name} se ha enfermado. Usa \`doro curar\` para sanarlo.\n│\n╰─✦` });
        return true;
    } else if (chance < 0.2) {
        doro.xp += 20;
        conn.sendMessage(doro.owner, { text: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡Qué suerte! Tu Doro ${doro.name} encontró 20 XP.\n│\n╰─✦` });
        return true;
    }
    return false;
};

const handleTimeBasedActions = (doro, conn) => {
    const now = new Date();
    const peruTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const peruHour = peruTime.getHours();

    const isNight = peruHour >= 22 || peruHour < 6;
    if (isNight && doro.lastSlept && (now.getTime() - doro.lastSlept > 12 * 60 * 60 * 1000)) {
        doro.health = Math.max(0, doro.health - 30);
        doro.happiness = Math.max(0, doro.happiness - 30);
        conn.sendMessage(doro.owner, { text: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡Tu Doro ${doro.name} se desmayó por no dormir! Su salud y felicidad han bajado.\n│\n╰─✦` });
        doro.lastSlept = now.getTime();
        return true;
    } else if (isNight && !doro.notifiedSleep) {
        conn.sendMessage(doro.owner, { text: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Ya es de noche en Perú. ¡Tu Doro ${doro.name} debería ir a dormir!\n│\n╰─✦` });
        doro.notifiedSleep = true;
        return true;
    } else if (!isNight) {
        if (doro.notifiedSleep) {
            doro.notifiedSleep = false;
            return true;
        }
    }
    return false;
};

const handler = async (m, { conn, text }) => {
  const args = text.trim().split(' ');
  const subCommand = args.shift().toLowerCase();
  const user = m.sender;

  let dorosDb = await readDb();
  let doroIndex = dorosDb.findIndex(doro => doro.owner === user);
  let userDoro = doroIndex !== -1 ? dorosDb[doroIndex] : null;

  if (userDoro && subCommand !== 'crear') {
      const eventsChanged = handleRandomEvents(userDoro, conn);
      const timeChanged = handleTimeBasedActions(userDoro, conn);
      const achievementsChanged = checkAchievements(userDoro, conn);
      const levelUpChanged = checkLevelUp(userDoro, conn);
      if (eventsChanged || timeChanged || achievementsChanged || levelUpChanged) {
          dorosDb[doroIndex] = userDoro;
          await saveDb(dorosDb);
      }
  }

  if (subCommand === 'crear') {
    if (userDoro) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡Ya tienes un Doro!\n│\n╰─✦');
    const doroName = args.join(' ');
    if (!doroName) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Debes proporcionar un nombre. Ejemplo: `doro crear MiDoro`\n│\n╰─✦');
    if (dorosDb.some(doro => doro.name.toLowerCase() === doroName.toLowerCase())) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Ese nombre ya está en uso.\n│\n╰─✦');
    const newDoro = {
      name: doroName, owner: user, health: 100, happiness: 100, xp: 0, level: 1,
      friends: [], friendRequests: [], achievements: [],
      lastSlept: null, lastFed: null, lastPlayed: null, isSick: false, notifiedSleep: false,
    };
    dorosDb.push(newDoro);
    await saveDb(dorosDb);
    return m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡Felicidades! Has adoptado un Doro llamado ${doroName}.\n│\n╰─✦`);
  }

  if (!userDoro) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」No tienes un Doro. Usa `doro crear <nombre>`.\n│\n╰─✦');

  let needsSave = false;

  switch (subCommand) {
    case 'perfil':
      const profileMsg = `
╭─❍「 ✦ Perfil de ${userDoro.name} ✦ 」
├─ 💖 Salud: ${userDoro.health}/100 ${userDoro.isSick ? '(Enfermo 🤒)' : ''}
├─ 😊 Felicidad: ${userDoro.happiness}/100
├─ ✨ XP: ${userDoro.xp}/${userDoro.level * XP_PER_LEVEL}
├─ 🏆 Nivel: ${userDoro.level}
├─ 👤 Dueño: @${userDoro.owner.split('@')[0]}
╰─✦`.trim();
      conn.sendMessage(m.chat, { text: profileMsg, mentions: [userDoro.owner] }, { quoted: m });
      break;

    case 'alimentar':
      if (Date.now() - (userDoro.lastFed || 0) < COOLDOWN) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Tu Doro todavía está lleno.\n│\n╰─✦');
      userDoro.health = Math.min(100, userDoro.health + 10);
      userDoro.happiness = Math.min(100, userDoro.happiness + 5);
      userDoro.xp += 5;
      userDoro.lastFed = Date.now();
      needsSave = true;
      conn.sendMessage(m.chat, { image: { url: getRandomImage('eating') }, caption: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡Ñam! ${userDoro.name} ha comido. 💖\n│\n╰─✦` }, { quoted: m });
      break;

    case 'jugar':
      if (Date.now() - (userDoro.lastPlayed || 0) < COOLDOWN) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Tu Doro está cansado.\n│\n╰─✦');
      userDoro.happiness = Math.min(100, userDoro.happiness + 15);
      userDoro.health = Math.max(0, userDoro.health - 5);
      userDoro.xp += 10;
      userDoro.lastPlayed = Date.now();
      needsSave = true;
      conn.sendMessage(m.chat, { image: { url: getRandomImage('playing') }, caption: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡Wiii! ${userDoro.name} se divirtió. 😊\n│\n╰─✦` }, { quoted: m });
      break;

    case 'dormir':
      if (Date.now() - (userDoro.lastSlept || 0) < COOLDOWN * 2) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Tu Doro no tiene sueño.\n│\n╰─✦');
      userDoro.health = 100;
      userDoro.isSick = false;
      userDoro.lastSlept = Date.now();
      needsSave = true;
      conn.sendMessage(m.chat, { image: { url: getRandomImage('sleeping') }, caption: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Shhh... ${userDoro.name} se ha dormido. 😴💤\n│\n╰─✦` }, { quoted: m });
      break;

    case 'curar':
      if (!userDoro.isSick) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Tu Doro no está enfermo.\n│\n╰─✦');
      userDoro.health = Math.min(100, userDoro.health + 30);
      userDoro.isSick = false;
      needsSave = true;
      m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Le has dado medicina a ${userDoro.name} y se siente mejor.\n│\n╰─✦`);
      break;

    case 'agregar-amigo': {
      const friendName = args.join(' ');
      if (!friendName) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Especifica el nombre del Doro amigo.\n│\n╰─✦');
      const friendDoroIndex = dorosDb.findIndex(d => d.name.toLowerCase() === friendName.toLowerCase());
      const friendDoro = friendDoroIndex !== -1 ? dorosDb[friendDoroIndex] : null;
      if (!friendDoro) return m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」No se encontró un Doro llamado ${friendName}.\n│\n╰─✦`);
      if (friendDoro.owner === user) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」No puedes agregarte a ti mismo.\n│\n╰─✦');
      if (userDoro.friends.includes(friendDoro.owner)) return m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Ya eres amigo de ${friendName}.\n│\n╰─✦`);
      if (friendDoro.friendRequests && friendDoro.friendRequests.includes(userDoro.owner)) return m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Ya enviaste una solicitud a ${friendName}.\n│\n╰─✦`);
      if (!friendDoro.friendRequests) friendDoro.friendRequests = [];
      friendDoro.friendRequests.push(userDoro.owner);
      dorosDb[friendDoroIndex] = friendDoro;
      needsSave = true;
      m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Solicitud de amistad enviada a ${friendName}.\n│\n╰─✦`);
      conn.sendMessage(friendDoro.owner, { text: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡${userDoro.name} quiere ser tu amigo! Usa \`doro aceptar-amigo ${userDoro.name}\`.\n│\n╰─✦`});
      break;
    }

    case 'aceptar-amigo': {
      const requesterName = args.join(' ');
      if (!requesterName) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Especifica el nombre del Doro.\n│\n╰─✦');
      const requesterDoroIndex = dorosDb.findIndex(d => d.name.toLowerCase() === requesterName.toLowerCase());
      const requesterDoro = requesterDoroIndex !== -1 ? dorosDb[requesterDoroIndex] : null;
      if (!requesterDoro) return m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」No se encontró un Doro llamado ${requesterName}.\n│\n╰─✦`);
      if (!userDoro.friendRequests || !userDoro.friendRequests.includes(requesterDoro.owner)) return m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」No tienes solicitud de ${requesterName}.\n│\n╰─✦`);
      userDoro.friendRequests = userDoro.friendRequests.filter(owner => owner !== requesterDoro.owner);
      userDoro.friends.push(requesterDoro.owner);
      requesterDoro.friends.push(userDoro.owner);
      needsSave = true;
      conn.sendMessage(m.chat, { image: { url: getRandomImage('new_friend') }, caption: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡Ahora eres amigo de ${requesterName}! 🎉\n│\n╰─✦` }, { quoted: m });
      conn.sendMessage(requesterDoro.owner, { text: `╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」¡${userDoro.name} aceptó tu solicitud!\n│\n╰─✦` });
      break;
    }

    case 'amigos':
      if (userDoro.friends.length === 0) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Aún no tienes amigos.\n│\n╰─✦');
      const friendNames = userDoro.friends.map(owner => dorosDb.find(d => d.owner === owner)?.name || 'Desconocido');
      m.reply(`╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」Tus amigos: ${friendNames.join(', ')}\n│\n╰─✦`);
      break;

    case 'top':
      const sortedDoros = [...dorosDb].sort((a, b) => b.xp - a.xp).slice(0, 10);
      let topMsg = '╭─❍「 ✦ Top 10 Doros con más XP ✦ 」\n\n';
      sortedDoros.forEach((d, index) => { topMsg += `├─ ${index + 1}. ${d.name} (@${d.owner.split('@')[0]}) - ${d.xp} XP\n`; });
      topMsg += '\n╰─✦';
      conn.sendMessage(m.chat, { text: topMsg, mentions: sortedDoros.map(d => d.owner) }, { quoted: m });
      break;

    case 'logros':
      if (userDoro.achievements.length === 0) return m.reply('╭─❍「 ✦ MaycolPlus ✦ 」\n│\n├─ 「❀」No has ganado ningún logro.\n│\n╰─✦');
      let achievementsMsg = '╭─❍「 ✦ Logros Desbloqueados ✦ 」\n\n';
      userDoro.achievements.forEach(ach => { achievementsMsg += `├─ ${achievements[ach].name}: ${achievements[ach].description}\n`; });
      achievementsMsg += '\n╰─✦';
      m.reply(achievementsMsg);
      break;

    default:
      m.reply(
`╭─❍「 ✦ Comandos de Doro ✦ 」
│
├─ doro crear <nombre>
├─ doro perfil
├─ doro alimentar, jugar, dormir, curar
├─ doro agregar-amigo <nombre>
├─ doro aceptar-amigo <nombre>
├─ doro amigos, top, logros
│
╰─✦`
      );
  }

  if (needsSave) {
    if (checkLevelUp(userDoro, conn)) {
        // userDoro object is modified by checkLevelUp, so we just need to save.
    }
    dorosDb[doroIndex] = userDoro;
    await saveDb(dorosDb);
  }
};

handler.command = ["doro", "cuidadoro"];
handler.help = ["doro crear <nombre>", "doro perfil", "doro alimentar", "doro jugar", "doro dormir", "doro curar", "doro agregar-amigo <nombre>", "doro aceptar-amigo <nombre>", "doro amigos", "doro top", "doro logros"];
handler.tags = ["diversion"];
handler.register = true;

export default handler;
