const fs = require('node:fs/promises');
const path = require('node:path');

const STORE_DIR = path.resolve(__dirname, '../../../../.cache');
const STORE_FILE = path.join(STORE_DIR, 'ai-chat-sessions.json');
const SESSION_TTL_MS = Number.parseInt(process.env.AI_CHAT_SESSION_TTL_MS || '', 10) || (3 * 24 * 60 * 60 * 1000);
const MAX_STORED_SESSIONS = Number.parseInt(process.env.AI_CHAT_MAX_STORED_SESSIONS || '', 10) || 500;

let writeQueue = Promise.resolve();

const getLastActivity = (session = {}) => {
  const messages = Array.isArray(session.messages) ? session.messages : [];
  if (!messages.length) {
    return 0;
  }

  return Number(messages[messages.length - 1]?.createdAt || 0);
};

const normalizeSession = (rawSession = {}) => {
  const messages = Array.isArray(rawSession.messages)
    ? rawSession.messages
      .filter((message) => message && typeof message.role === 'string' && typeof message.text === 'string')
      .map((message) => ({
        role: message.role,
        text: message.text,
        createdAt: Number(message.createdAt || Date.now())
      }))
    : [];

  const symptoms = Array.isArray(rawSession.symptoms)
    ? rawSession.symptoms.map((symptom) => String(symptom).trim()).filter(Boolean)
    : [];

  return {
    symptoms: new Set(symptoms),
    messages
  };
};

const pruneSessions = (sessionsMap) => {
  const now = Date.now();

  const activeEntries = [...sessionsMap.entries()]
    .filter(([, session]) => {
      const lastActivity = getLastActivity(session);
      return lastActivity && (now - lastActivity) <= SESSION_TTL_MS;
    })
    .sort((a, b) => getLastActivity(b[1]) - getLastActivity(a[1]))
    .slice(0, MAX_STORED_SESSIONS);

  return new Map(activeEntries);
};

const loadSessions = async () => {
  try {
    const content = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(content);
    const rawSessions = parsed && typeof parsed === 'object' ? parsed.sessions : {};

    const hydrated = new Map();
    for (const [sessionId, session] of Object.entries(rawSessions || {})) {
      hydrated.set(sessionId, normalizeSession(session));
    }

    return pruneSessions(hydrated);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return new Map();
    }

    return new Map();
  }
};

const serializeSessions = (sessionsMap) => {
  const sessions = {};

  for (const [sessionId, session] of sessionsMap.entries()) {
    sessions[sessionId] = {
      symptoms: [...(session.symptoms || [])],
      messages: Array.isArray(session.messages) ? session.messages : []
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    sessionCount: Object.keys(sessions).length,
    sessions
  };
};

const persistSessions = async (sessionsMap) => {
  const pruned = pruneSessions(sessionsMap);
  const payload = serializeSessions(pruned);

  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      await fs.mkdir(STORE_DIR, { recursive: true });
      await fs.writeFile(STORE_FILE, JSON.stringify(payload), 'utf8');
    });

  await writeQueue;

  return pruned;
};

module.exports = {
  loadSessions,
  persistSessions
};
