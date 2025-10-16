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
    if (e.code === 'ENOENT') return [];
    console.error("Failed to read or parse doros.json:", e);
    return [];
  }
};

const saveDb = async (data) => {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};

const checkLevelUp = (doro) => {
    let notifications = [];
    let changed = false;
    while (doro.xp >= doro.level * XP_PER_LEVEL) {
        doro.level++;
        doro.health = 100;
        doro.happiness = 100;
        notifications.push(`「❀」¡Felicidades! Tu Doro ${doro.name} ha subido al nivel ${doro.level}.`);
        changed = true;
    }
    return { changed, notifications };
}

const checkAchievements = (doro) => {
  let notifications = [];
  let changed = false;
  if (doro.friends.length >= achievements.social_butterfly.goal && !doro.achievements.includes("social_butterfly")) {
    doro.achievements.push("social_butterfly");
    notifications.push(`「❀」¡Tu Doro ${doro.name} ha ganado el logro "${achievements.social_butterfly.name}"!`);
    changed = true;
  }
  if (doro.xp >= achievements.xp_master.goal && !doro.achievements.includes("xp_master")) {
    doro.achievements.push("xp_master");
    notifications.push(`「❀」¡Tu Doro ${doro.name} ha ganado el logro "${achievements.xp_master.name}"!`);
    changed = true;
  }
  return { changed, notifications };
};

const handleRandomEvents = (doro) => {
    let notifications = [];
    let changed = false;
    const chance = Math.random();
    if (chance < 0.1) {
        doro.health = Math.max(0, doro.health - 20);
        doro.isSick = true;
        notifications.push(`「❀」¡Oh no! Tu Doro ${doro.name} se ha enfermado. Usa \`doro curar\` para sanarlo.`);
        changed = true;
    } else if (chance < 0.2) {
        doro.xp += 20;
        notifications.push(`「❀」¡Qué suerte! Tu Doro ${doro.name} encontró 20 XP.`);
        changed = true;
    }
    return { changed, notifications };
};

const handleTimeBasedActions = (doro) => {
    let notifications = [];
    let changed = false;
    const now = new Date();
    const peruTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const peruHour = peruTime.getHours();

    const isNight = peruHour >= 22 || peruHour < 6;
    if (isNight && doro.lastSlept && (now.getTime() - doro.lastSlept > 12 * 60 * 60 * 1000)) {
        doro.health = Math.max(0, doro.health - 30);
        doro.happiness = Math.max(0, doro.happiness - 30);
        notifications.push(`「❀」¡Tu Doro ${doro.name} se desmayó por no dormir! Su salud y felicidad han bajado.`);
        doro.lastSlept = now.getTime();
        changed = true;
    } else if (isNight && !doro.notifiedSleep) {
        notifications.push(`「❀」Ya es de noche en Perú. ¡Tu Doro ${doro.name} debería ir a dormir!`);
        doro.notifiedSleep = true;
        changed = true;
    } else if (!isNight) {
        if (doro.notifiedSleep) {
            doro.notifiedSleep = false;
            changed = true;
        }
    }
    return { changed, notifications };
};

const handler = async (m, { conn, text }) => {
  const args = text.trim().split(' ');
  const subCommand = args.shift().toLowerCase();
  const user = m.sender;

  let dorosDb = await readDb();
  let doroIndex = dorosDb.findIndex(doro => doro.owner === user);
  let userDoro = doroIndex !== -1 ? dorosDb[doroIndex] : null;

  const formatMessage = (mainContent, notifications = []) => {
      let message = "╭─❍「 ✦ MaycolPlus ✦ 」\n";
      if (notifications.length > 0) {
          notifications.forEach(notif => {
              message += `│\n├─ ${notif}\n`;
          });
      }
      message += `│\n├─ ${mainContent}\n│\n╰─✦`;
      return message;
  };

  if (subCommand === 'crear') {
    if (userDoro) return m.reply(formatMessage('¡Ya tienes un Doro!'));
    const doroName = args.join(' ');
    if (!doroName) return m.reply(formatMessage('Debes proporcionar un nombre. Ejemplo: `doro crear MiDoro`'));
    if (dorosDb.some(doro => doro.name.toLowerCase() === doroName.toLowerCase())) return m.reply(formatMessage('Ese nombre ya está en uso.'));
    const newDoro = {
      name: doroName, owner: user, health: 100, happiness: 100, xp: 0, level: 1,
      friends: [], friendRequests: [], achievements: [],
      lastSlept: null, lastFed: null, lastPlayed: null, isSick: false, notifiedSleep: false,
    };
    dorosDb.push(newDoro);
    await saveDb(dorosDb);
    return m.reply(formatMessage(`¡Felicidades! Has adoptado un Doro llamado ${doroName}.`));
  }

  if (!userDoro) return m.reply(formatMessage('No tienes un Doro. Usa `doro crear <nombre>`.'));

  let needsSave = false;
  let mainResponse = '';
  let eventNotifications = [];

  // Process actions and events before sending response
  let stateChangedByAction = false;

  // Most commands modify the Doro's state. We'll handle the logic first.
  switch (subCommand) {
      case 'alimentar':
          if (Date.now() - (userDoro.lastFed || 0) < COOLDOWN) { mainResponse = 'Tu Doro todavía está lleno.'; break; }
          userDoro.health = Math.min(100, userDoro.health + 10);
          userDoro.happiness = Math.min(100, userDoro.happiness + 5);
          userDoro.xp += 5;
          userDoro.lastFed = Date.now();
          stateChangedByAction = true;
          mainResponse = `¡Ñam! ${userDoro.name} ha comido. 💖`;
          break;
      case 'jugar':
          if (Date.now() - (userDoro.lastPlayed || 0) < COOLDOWN) { mainResponse = 'Tu Doro está cansado.'; break; }
          userDoro.happiness = Math.min(100, userDoro.happiness + 15);
          userDoro.health = Math.max(0, userDoro.health - 5);
          userDoro.xp += 10;
          userDoro.lastPlayed = Date.now();
          stateChangedByAction = true;
          mainResponse = `¡Wiii! ${userDoro.name} se divirtió. 😊`;
          break;
      case 'dormir':
          if (Date.now() - (userDoro.lastSlept || 0) < COOLDOWN * 2) { mainResponse = 'Tu Doro no tiene sueño.'; break; }
          userDoro.health = 100;
          userDoro.isSick = false;
          userDoro.lastSlept = Date.now();
          stateChangedByAction = true;
          mainResponse = `Shhh... ${userDoro.name} se ha dormido. 😴💤`;
          break;
      case 'curar':
          if (!userDoro.isSick) { mainResponse = 'Tu Doro no está enfermo.'; break; }
          userDoro.health = Math.min(100, userDoro.health + 30);
          userDoro.isSick = false;
          stateChangedByAction = true;
          mainResponse = `Le has dado medicina a ${userDoro.name} y se siente mejor.`;
          break;
      case 'agregar-amigo': {
          const friendName = args.join(' ');
          if (!friendName) { mainResponse = 'Especifica el nombre del Doro amigo.'; break; }
          const friendDoroIndex = dorosDb.findIndex(d => d.name.toLowerCase() === friendName.toLowerCase());
          if (friendDoroIndex === -1) { mainResponse = `No se encontró un Doro llamado ${friendName}.`; break; }
          const friendDoro = dorosDb[friendDoroIndex];
          if (friendDoro.owner === user) { mainResponse = 'No puedes agregarte a ti mismo.'; break; }
          if (userDoro.friends.includes(friendDoro.owner)) { mainResponse = `Ya eres amigo de ${friendName}.`; break; }
          if (friendDoro.friendRequests?.includes(userDoro.owner)) { mainResponse = `Ya enviaste una solicitud a ${friendName}.`; break; }
          if (!friendDoro.friendRequests) friendDoro.friendRequests = [];
          friendDoro.friendRequests.push(userDoro.owner);
          stateChangedByAction = true;
          mainResponse = `Solicitud de amistad enviada a ${friendName}.`;
          conn.sendMessage(friendDoro.owner, { text: formatMessage(`¡${userDoro.name} quiere ser tu amigo! Usa \`doro aceptar-amigo ${userDoro.name}\`.`) });
          break;
      }
      case 'aceptar-amigo': {
          const requesterName = args.join(' ');
          if (!requesterName) { mainResponse = 'Especifica el nombre del Doro.'; break; }
          const requesterDoroIndex = dorosDb.findIndex(d => d.name.toLowerCase() === requesterName.toLowerCase());
          if (requesterDoroIndex === -1) { mainResponse = `No se encontró un Doro llamado ${requesterName}.`; break; }
          const requesterDoro = dorosDb[requesterDoroIndex];
          if (!userDoro.friendRequests?.includes(requesterDoro.owner)) { mainResponse = `No tienes solicitud de ${requesterName}.`; break; }
          userDoro.friendRequests = userDoro.friendRequests.filter(owner => owner !== requesterDoro.owner);
          userDoro.friends.push(requesterDoro.owner);
          requesterDoro.friends.push(userDoro.owner);
          stateChangedByAction = true;
          mainResponse = `¡Ahora eres amigo de ${requesterName}! 🎉`;
          conn.sendMessage(requesterDoro.owner, { text: formatMessage(`¡${userDoro.name} aceptó tu solicitud!`) });
          break;
      }
  }

  // Handle automatic events and checks
  const randomEvents = handleRandomEvents(userDoro);
  const timeActions = handleTimeBasedActions(userDoro);
  const achievements = checkAchievements(userDoro);
  const levelUp = checkLevelUp(userDoro);

  eventNotifications.push(...randomEvents.notifications, ...timeActions.notifications, ...achievements.notifications, ...levelUp.notifications);
  const stateChangedByEvents = randomEvents.changed || timeActions.changed || achievements.changed || levelUp.changed;

  // Single save to DB if anything changed
  if (stateChangedByAction || stateChangedByEvents) {
      dorosDb[doroIndex] = userDoro;
      await saveDb(dorosDb);
  }

  // Final message sending
  const sendFinalMessage = async (content, options = {}) => {
      const { image, mentions, isProfile, isList } = options;
      
      let finalMessage;
      if (isProfile) {
          finalMessage = `╭─❍「 ✦ Perfil de ${userDoro.name} ✦ 」\n${content}\n╰─✦`;
      } else if (isList) {
          finalMessage = content; // Lists format themselves
      } else {
          finalMessage = formatMessage(content, eventNotifications);
      }
      
      if (image) {
          await conn.sendMessage(m.chat, { image: { url: image }, caption: finalMessage, mentions: mentions || [] }, { quoted: m });
      } else {
          await conn.sendMessage(m.chat, { text: finalMessage, mentions: mentions || [] }, { quoted: m });
      }
  };

  switch (subCommand) {
    case 'perfil':
      mainResponse = `
├─ 💖 Salud: ${userDoro.health}/100 ${userDoro.isSick ? '(Enfermo 🤒)' : ''}
├─ 😊 Felicidad: ${userDoro.happiness}/100
├─ ✨ XP: ${userDoro.xp}/${userDoro.level * XP_PER_LEVEL}
├─ 🏆 Nivel: ${userDoro.level}
├─ 👤 Dueño: @${userDoro.owner.split('@')[0]}
      `.trim();
      await sendFinalMessage(mainResponse, { isProfile: true, mentions: [userDoro.owner] });
      break;
    case 'amigos':
      if (userDoro.friends.length === 0) mainResponse = 'Aún no tienes amigos.';
      else {
          const friendNames = userDoro.friends.map(owner => dorosDb.find(d => d.owner === owner)?.name || 'Desconocido');
          mainResponse = `Tus amigos: ${friendNames.join(', ')}`;
      }
      await sendFinalMessage(mainResponse);
      break;
    case 'top':
      const sortedDoros = [...dorosDb].sort((a, b) => b.xp - a.xp).slice(0, 10);
      let topMsg = '╭─❍「 ✦ Top 10 Doros ✦ 」\n\n';
      sortedDoros.forEach((d, index) => { topMsg += `├─ ${index + 1}. ${d.name} (@${d.owner.split('@')[0]}) - ${d.xp} XP\n`; });
      topMsg += '\n╰─✦';
      await sendFinalMessage(topMsg, { isList: true, mentions: sortedDoros.map(d => d.owner) });
      break;
    case 'logros':
      if (userDoro.achievements.length === 0) { mainResponse = 'No has ganado ningún logro.'; await sendFinalMessage(mainResponse); break; }
      let achievementsMsg = '╭─❍「 ✦ Logros Desbloqueados ✦ 」\n\n';
      userDoro.achievements.forEach(ach => { achievementsMsg += `├─ ${achievements[ach].name}: ${achievements[ach].description}\n`; });
      achievementsMsg += '\n╰─✦';
      await sendFinalMessage(achievementsMsg, { isList: true });
      break;
    case 'alimentar':
    case 'jugar':
    case 'dormir':
    case 'curar':
    case 'agregar-amigo':
    case 'aceptar-amigo':
        await sendFinalMessage(mainResponse, { image: subCommand.match(/alimentar|jugar|dormir|aceptar-amigo/) ? getRandomImage(subCommand.replace('-amigo', '')) : null });
        break;
    default:
        const helpMsg = `
╭─❍「 ✦ Comandos de Doro ✦ 」
│
├─ doro crear <nombre>
├─ doro perfil
├─ doro alimentar, jugar, dormir, curar
├─ doro agregar-amigo <nombre>
├─ doro aceptar-amigo <nombre>
├─ doro amigos, top, logros
│
╰─✦`.trim();
        await m.reply(helpMsg);
  }
};

handler.command = ["doro", "cuidadoro"];
handler.help = ["doro crear <nombre>", "doro perfil", "doro alimentar", "doro jugar", "doro dormir", "doro curar", "doro agregar-amigo <nombre>", "doro aceptar-amigo <nombre>", "doro amigos", "doro top", "doro logros"];
handler.tags = ["diversion"];
handler.register = true;

export default handler;
      
