const { randomUUID } = require('node:crypto');
const knowledgeBase = require('./knowledge.base.json');
const { prisma } = require('../../database/prisma');
const { Pinecone } = require('@pinecone-database/pinecone');
const { loadSessions, persistSessions } = require('./session.store');
const { getLatestRates, convertFromBase } = require('../exchangeRate/exchangeRate.service');

const chatSessions = new Map();
const MAX_SESSION_MESSAGES = 20;
let hasLoadedPersistedSessions = false;
let loadSessionsPromise = null;

const RED_FLAG_KEYWORDS = [
  'chest pain',
  'shortness of breath',
  'difficulty breathing',
  'unconscious',
  'fainting',
  'blood in stool',
  'blood in vomit',
  'severe dehydration',
  'seizure',
  'anaphylaxis',
  'swollen tongue',
  'swelling lips'
];

const SYMPTOM_KEYWORDS = [
  'fever',
  'headache',
  'body pain',
  'body ache',
  'joint pain',
  'muscle pain',
  'cough',
  'cold',
  'sore throat',
  'runny nose',
  'running nose',
  'nasal congestion',
  'blocked nose',
  'irritation',
  'eye irritation',
  'acidity',
  'heartburn',
  'indigestion',
  'allergy',
  'itching',
  'rash',
  'vomiting',
  'diarrhea'
];

const SYMPTOM_ALIASES = {
  'running nose': 'runny nose',
  'body ache': 'body pain',
  'muscle pain': 'body pain'
};

const GREETING_PATTERNS = [
  'hello',
  'hi',
  'hey',
  'good morning',
  'good evening',
  'thanks',
  'thank you'
];

let embedderPipeline = null;
let groqClient = null;
let pineconeClient = null;
let pineconeIndex = null;
let pineconeSynced = false;

const normalizeKbId = (id) => {
  const raw = String(id || '').trim();
  if (!raw) return `kb-${randomUUID()}`;
  return raw.startsWith('kb-') ? raw : `kb-${raw}`;
};

const tokenize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const toSet = (arr) => new Set(arr || []);

const cosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

const keywordScore = (queryText, doc) => {
  const queryTokens = toSet(tokenize(queryText));
  const docTokens = toSet(tokenize(`${doc.content} ${(doc.metadata?.symptoms || []).join(' ')}`));

  let overlap = 0;
  queryTokens.forEach((token) => {
    if (docTokens.has(token)) overlap += 1;
  });

  if (!queryTokens.size) return 0;
  return overlap / queryTokens.size;
};

const hasRedFlags = (text) => {
  const normalized = String(text || '').toLowerCase();
  return RED_FLAG_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const extractSymptoms = (text) => {
  const normalized = String(text || '').toLowerCase();
  const found = new Set();

  SYMPTOM_KEYWORDS.forEach((symptom) => {
    if (normalized.includes(symptom)) {
      found.add(symptom);
    }
  });

  // Also detect KB-defined symptoms to reduce misses when new symptom terms are added to knowledge base.
  for (const doc of knowledgeBase) {
    for (const symptom of doc.metadata?.symptoms || []) {
      const normalizedSymptom = String(symptom || '').toLowerCase().trim();
      if (!normalizedSymptom) continue;
      if (normalized.includes(normalizedSymptom)) {
        found.add(normalizedSymptom);
      }
    }
  }

  return [...found].map((symptom) => SYMPTOM_ALIASES[symptom] || symptom);
};

const isGreetingOrSmallTalk = (text) => {
  const normalized = String(text || '').toLowerCase().trim();
  if (!normalized) return false;

  return GREETING_PATTERNS.some((token) => normalized === token || normalized.startsWith(`${token} `));
};

const ensureSessionsLoaded = async () => {
  if (hasLoadedPersistedSessions) {
    return;
  }

  if (!loadSessionsPromise) {
    loadSessionsPromise = loadSessions()
      .then((persistedSessions) => {
        for (const [sessionId, state] of persistedSessions.entries()) {
          chatSessions.set(sessionId, state);
        }

        hasLoadedPersistedSessions = true;
      })
      .catch(() => {
        hasLoadedPersistedSessions = true;
      });
  }

  await loadSessionsPromise;
};

const saveSessionsSafely = async () => {
  try {
    const pruned = await persistSessions(chatSessions);
    chatSessions.clear();
    for (const [sessionId, state] of pruned.entries()) {
      chatSessions.set(sessionId, state);
    }
  } catch (_error) {
    // Keep serving requests even if persistence fails.
  }
};

const getSessionState = async (sessionId) => {
  await ensureSessionsLoaded();

  const existing = chatSessions.get(sessionId);
  if (existing) return existing;

  const created = {
    symptoms: new Set(),
    messages: []
  };
  chatSessions.set(sessionId, created);
  return created;
};

const rememberMessage = async (state, role, text) => {
  state.messages.push({ role, text, createdAt: Date.now() });
  if (state.messages.length > MAX_SESSION_MESSAGES) {
    state.messages.shift();
  }

  await saveSessionsSafely();
};

const getEmbedder = async () => {
  if (embedderPipeline !== null) return embedderPipeline;

  try {
    const transformers = await import('@xenova/transformers');
    embedderPipeline = await transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  } catch (_error) {
    embedderPipeline = false;
  }

  return embedderPipeline;
};

const embedText = async (text) => {
  const embedder = await getEmbedder();
  if (!embedder) return null;

  try {
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (_error) {
    return null;
  }
};

const getPineconeIndex = async () => {
  if (pineconeIndex) return pineconeIndex;

  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;

  if (!apiKey || !indexName) {
    pineconeIndex = false;
    return pineconeIndex;
  }

  try {
    pineconeClient = new Pinecone({ apiKey });
    pineconeIndex = pineconeClient.index(indexName);
  } catch (_error) {
    pineconeIndex = false;
  }

  return pineconeIndex;
};

const syncKnowledgeBaseToPinecone = async () => {
  if (pineconeSynced) return true;

  const index = await getPineconeIndex();
  if (!index) return false;

  const vectors = [];
  for (const doc of knowledgeBase) {
    const vector = await embedText(`${doc.content} ${(doc.metadata?.symptoms || []).join(' ')}`);
    if (!vector) {
      continue;
    }

    vectors.push({
      id: normalizeKbId(doc.id),
      values: vector,
      metadata: {
        docId: normalizeKbId(doc.id),
        content: doc.content,
        symptoms: (doc.metadata?.symptoms || []).join(', '),
        productKeywords: (doc.metadata?.productKeywords || []).join(', '),
        rx: Boolean(doc.metadata?.rx),
        followUp: doc.metadata?.followUp || ''
      }
    });
  }

  if (vectors.length) {
    await index.upsert(vectors);
  }

  pineconeSynced = true;
  return true;
};

const syncKnowledgeBase = async ({ force = false } = {}) => {
  if (force) {
    pineconeSynced = false;
  }

  const index = await getPineconeIndex();
  if (!index) {
    return {
      success: false,
      reason: 'Pinecone is not configured. Set PINECONE_API_KEY and PINECONE_INDEX_NAME.'
    };
  }

  const vectors = [];
  for (const doc of knowledgeBase) {
    const vector = await embedText(`${doc.content} ${(doc.metadata?.symptoms || []).join(' ')}`);
    if (!vector) continue;

    vectors.push({
      id: normalizeKbId(doc.id),
      values: vector,
      metadata: {
        docId: normalizeKbId(doc.id),
        content: doc.content,
        symptoms: (doc.metadata?.symptoms || []).join(', '),
        productKeywords: (doc.metadata?.productKeywords || []).join(', '),
        rx: Boolean(doc.metadata?.rx),
        followUp: doc.metadata?.followUp || ''
      }
    });
  }

  if (!vectors.length) {
    return {
      success: false,
      reason: 'No vectors were generated from knowledge base entries.'
    };
  }

  await index.upsert(vectors);
  pineconeSynced = true;

  return {
    success: true,
    totalDocs: knowledgeBase.length,
    upsertedCount: vectors.length,
    skippedCount: knowledgeBase.length - vectors.length,
    indexName: process.env.PINECONE_INDEX_NAME
  };
};

const retrieveTopK = async (queryText, k = 4) => {
  const queryVector = await embedText(queryText);

  if (!queryVector) {
    return [...knowledgeBase]
      .map((doc) => ({ doc, score: keywordScore(queryText, doc) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((entry) => entry.doc);
  }

  const index = await getPineconeIndex();
  if (index) {
    try {
      await syncKnowledgeBaseToPinecone();
      const result = await index.query({
        vector: queryVector,
        topK: k,
        includeMetadata: true
      });

      const mapped = (result?.matches || []).map((match) => {
        const metadata = match.metadata || {};
        return {
          id: metadata.docId || String(match.id || ''),
          content: metadata.content || '',
          metadata: {
            symptoms: String(metadata.symptoms || '')
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
            productKeywords: String(metadata.productKeywords || '')
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
            rx: Boolean(metadata.rx),
            followUp: metadata.followUp || ''
          }
        };
      });

      if (mapped.length) {
        return mapped;
      }
    } catch (_error) {
      // Fall back to local retrieval if Pinecone query fails.
    }
  }
  return [...knowledgeBase]
    .map((doc) => {
      return {
        doc,
        score: keywordScore(queryText, doc)
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((entry) => entry.doc);
};

const getGroqClient = async () => {
  if (groqClient !== null) return groqClient;

  if (!process.env.GROQ_API_KEY) {
    groqClient = false;
    return groqClient;
  }

  try {
    const mod = await import('groq-sdk');
    const Groq = mod.default;
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch (_error) {
    groqClient = false;
  }

  return groqClient;
};

const formatFallbackReply = ({ retrievedDocs, symptoms, products, isIntake }) => {
  if (isIntake) {
    return `Got it. I noted ${symptoms.join(', ')}. Please share duration, severity, and age group so I can refine safe recommendations.`;
  }

  const guidance = retrievedDocs.map((doc) => doc.content).slice(0, 2).join(' ');
  const productText = products.length
    ? ` Available products you can consider on MedIQ: ${products.map((p) => p.name).join(', ')}.`
    : ' I could not find a close in-stock product match right now.';

  return `${guidance}${productText} This is not a diagnosis; consult a doctor if symptoms persist or worsen.`;
};

const buildGroundedRecommendationReply = ({ symptoms, products }) => {
  const symptomText = symptoms.length ? symptoms.join(', ') : 'your symptoms';

  if (!products.length) {
    return `I could not find a close in-stock match on MedIQ for ${symptomText} right now. Please avoid self-medication for persistent symptoms and consult a doctor for a tailored prescription.`;
  }

  return `Based on ${symptomText}, I found ${products.length} in-stock MedIQ options in the recommendation cards below. I am only suggesting items currently available on the platform. Please check dosage instructions, prescription requirement, and consult a doctor if symptoms persist or worsen.`;
};

const getMedicineFamilyKey = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/\b\d+(mg|ml|g)?\b/g, ' ')
    .replace(/\b(tablet|tab|capsule|cap|syrup|suspension|injection|drops|gel|cream|ointment)\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(' ')
    .trim();

const createLLMReply = async ({ userMessage, retrievedDocs, symptoms, products }) => {
  const client = await getGroqClient();

  const isIntake = symptoms.length < 2;
  if (!client) {
    return formatFallbackReply({ retrievedDocs, symptoms, products, isIntake });
  }

  try {
    const context = retrievedDocs.map((doc) => doc.content).join('\n');
    const productNames = products.map((product) => product.name).join(', ');
    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 350,
      messages: [
        {
          role: 'system',
          content: 'You are MedIQ symptom assistant. Never diagnose. First ensure safety. Use only provided context. Do not mention or invent any medicine/brand name unless it is present in the Available platform products list. If no products are available, do not suggest any medicine names. Keep response concise and clear.'
        },
        {
          role: 'user',
          content: `User message: ${userMessage}\nSymptoms captured: ${symptoms.join(', ') || 'none'}\nRetrieved context:\n${context}\nAvailable platform products: ${productNames || 'none'}`
        }
      ]
    });

    return completion?.choices?.[0]?.message?.content || formatFallbackReply({ retrievedDocs, symptoms, products, isIntake });
  } catch (_error) {
    return formatFallbackReply({ retrievedDocs, symptoms, products, isIntake });
  }
};

const mapToProducts = async ({ retrievedDocs, symptoms, buyerType = 'RETAIL', preferredCurrency = 'INR' }) => {
  const keywordSet = new Set();
  retrievedDocs.forEach((doc) => {
    (doc.metadata?.productKeywords || []).forEach((keyword) => keywordSet.add(String(keyword).toLowerCase()));
  });

  symptoms.forEach((symptom) => keywordSet.add(symptom));

  const keywords = [...keywordSet].slice(0, 8);

  const queryTerms = toSet([
    ...keywords,
    ...symptoms,
    ...tokenize(retrievedDocs.map((doc) => doc.content).join(' '))
  ]);

  const whereOr = keywords.map((keyword) => ({
    medicine: {
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { category: { contains: keyword, mode: 'insensitive' } },
        { brand: { contains: keyword, mode: 'insensitive' } }
      ]
    }
  }));

  const inventoryItems = await prisma.inventory.findMany({
    where: {
      quantity: { gt: 0 },
      isActive: true,
      medicine: {
        isActive: true,
        status: 'PUBLISHED'
      },
      ...(whereOr.length ? { OR: whereOr } : {})
    },
    include: {
      medicine: true,
      vendor: {
        select: {
          id: true,
          companyName: true
        }
      }
    },
    orderBy: [
      { updatedAt: 'desc' }
    ],
    take: 80
  });

  const rankedItems = inventoryItems
    .map((item) => {
      const searchable = `${item.medicine?.name || ''} ${item.medicine?.description || ''} ${item.medicine?.category || ''} ${item.medicine?.brand || ''}`;
      const medicineTokens = toSet(tokenize(searchable));

      let relevance = 0;
      queryTerms.forEach((term) => {
        if (medicineTokens.has(term)) {
          relevance += 1;
        }
      });

      if (keywords.some((kw) => (item.medicine?.name || '').toLowerCase().includes(kw))) {
        relevance += 3;
      }

      if (symptoms.some((symptom) => (item.medicine?.description || '').toLowerCase().includes(symptom))) {
        relevance += 2;
      }

      // Keep stock as a weak tiebreaker, not a primary ranking signal.
      relevance += Math.min(2, Math.floor((item.quantity || 0) / 100));

      return { item, relevance };
    })
    .sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      if ((b.item.medicine?.updatedAt?.getTime?.() || 0) !== (a.item.medicine?.updatedAt?.getTime?.() || 0)) {
        return (b.item.medicine?.updatedAt?.getTime?.() || 0) - (a.item.medicine?.updatedAt?.getTime?.() || 0);
      }
      return (b.item.quantity || 0) - (a.item.quantity || 0);
    })
    .map((entry) => entry.item);

  const uniqueInventoryItems = [];
  const seenMedicineIds = new Set();
  const seenMedicineFamilies = new Set();
  const usedCategories = new Set();

  // Pass 1: prioritize category diversity so every condition does not return the same few medicines.
  for (const item of rankedItems) {
    if (uniqueInventoryItems.length >= 5) break;

    const searchable = `${item.medicine?.name || ''} ${item.medicine?.description || ''} ${item.medicine?.category || ''} ${item.medicine?.brand || ''}`;
    const medicineTokens = toSet(tokenize(searchable));
    const hasRelevantMatch = !queryTerms.size || [...queryTerms].some((term) => medicineTokens.has(term));
    if (!hasRelevantMatch) {
      continue;
    }

    if (seenMedicineIds.has(item.medicine.id)) {
      continue;
    }

    const familyKey = getMedicineFamilyKey(item.medicine?.name);
    if (familyKey && seenMedicineFamilies.has(familyKey)) {
      continue;
    }

    const category = (item.medicine.category || 'uncategorized').toLowerCase();
    if (usedCategories.has(category)) {
      continue;
    }

    seenMedicineIds.add(item.medicine.id);
    if (familyKey) seenMedicineFamilies.add(familyKey);
    usedCategories.add(category);
    uniqueInventoryItems.push(item);
  }

  // Pass 2: fill remaining slots with highest-ranked unique medicines.
  for (const item of rankedItems) {
    if (uniqueInventoryItems.length >= 5) break;

    if (seenMedicineIds.has(item.medicine.id)) {
      continue;
    }

    const familyKey = getMedicineFamilyKey(item.medicine?.name);
    if (familyKey && seenMedicineFamilies.has(familyKey)) {
      continue;
    }

    seenMedicineIds.add(item.medicine.id);
    if (familyKey) seenMedicineFamilies.add(familyKey);
    uniqueInventoryItems.push(item);
  }

  const normalizedTargetCurrency = String(preferredCurrency || 'INR').toUpperCase();
  let rateRecord = null;

  if (normalizedTargetCurrency !== 'INR') {
    try {
      rateRecord = await getLatestRates('INR');
    } catch (_error) {
      rateRecord = null;
    }
  }

  return uniqueInventoryItems.map((item) => {
    const retailPrice = Number(((item.medicine.priceCents || 0) / 100).toFixed(2));
    const wholesalePrice = Number((((item.medicine.wholesalePriceCents ?? item.medicine.priceCents) || 0) / 100).toFixed(2));
    const bulkPrice = Number((((item.medicine.bulkPriceCents ?? item.medicine.wholesalePriceCents ?? item.medicine.priceCents) || 0) / 100).toFixed(2));
    const bulkMinQty = item.medicine.bulkMinQty || 1;

    const defaultPrice = buyerType === 'WHOLESALE' ? wholesalePrice : retailPrice;
    const convertedDisplayPrice = rateRecord?.rates
      ? convertFromBase(defaultPrice, normalizedTargetCurrency, rateRecord.rates)
      : null;

    const hasConvertedDisplay = Number.isFinite(convertedDisplayPrice);
    const displayCurrencyCode = hasConvertedDisplay ? normalizedTargetCurrency : 'INR';
    const displayPrice = Number((hasConvertedDisplay ? convertedDisplayPrice : defaultPrice).toFixed(2));

    return {
      id: item.id,
      medicineId: item.medicine.id,
      name: item.medicine.name,
      vendor: item.vendor?.companyName || 'Vendor',
      vendorId: item.vendor?.id,
      inStock: item.quantity > 0,
      stockLevel: item.quantity,
      imageUrl: item.imageUrl || null,
      requiresPrescription: Boolean(item.medicine.requiresPrescription),
      retailPrice,
      wholesalePrice,
      bulkPrice,
      bulkMinQty,
      displayPrice,
      displayCurrencyCode,
      baseCurrencyCode: 'INR',
      currencyCode: 'INR'
    };
  });
};

const buildFollowUpQuestion = (retrievedDocs) => {
  for (const doc of retrievedDocs) {
    if (doc.metadata?.followUp) {
      return doc.metadata.followUp;
    }
  }

  return 'Can you share duration, severity, and age group for better recommendations?';
};

const chatWithRag = async ({ message, sessionId, context = {}, user }) => {
  const activeSessionId = sessionId || randomUUID();
  const session = await getSessionState(activeSessionId);

  const extractedSymptoms = extractSymptoms(message);

  if (isGreetingOrSmallTalk(message) && extractedSymptoms.length === 0) {
    const reply = 'Hello. Share your symptoms, duration, and severity, and I will suggest available MedIQ options with safety guidance.';
    await rememberMessage(session, 'user', message);
    await rememberMessage(session, 'assistant', reply);

    return {
      sessionId: activeSessionId,
      type: 'message',
      symptomSummary: [...session.symptoms],
      reply,
      products: [],
      followUpQuestion: null
    };
  }

  await rememberMessage(session, 'user', message);

  extractedSymptoms.forEach((symptom) => session.symptoms.add(symptom));
  await saveSessionsSafely();

  if (hasRedFlags(message)) {
    const reply = 'Your symptoms may indicate a medical emergency. Please seek urgent in-person medical care or call emergency services immediately.';
    await rememberMessage(session, 'assistant', reply);

    return {
      sessionId: activeSessionId,
      type: 'redflag',
      symptomSummary: [...session.symptoms],
      reply,
      products: []
    };
  }

  const symptoms = [...session.symptoms];
  const query = `${message} ${symptoms.join(' ')}`.trim();
  const retrievedDocs = await retrieveTopK(query, 4);

  const buyerType = user?.customer?.buyerType || context?.buyerType || 'RETAIL';
  const preferredCurrency = context?.preferredCurrency || user?.preferredCurrency || 'INR';
  const products = await mapToProducts({ retrievedDocs, symptoms, buyerType, preferredCurrency });

  const requiresIntake = symptoms.length < 2;
  const llmReply = requiresIntake
    ? await createLLMReply({
      userMessage: message,
      retrievedDocs,
      symptoms,
      products
    })
    : buildGroundedRecommendationReply({ symptoms, products });

  const followUpQuestion = buildFollowUpQuestion(retrievedDocs);

  const finalReply = requiresIntake
    ? `${llmReply}\n\n${followUpQuestion}`
    : llmReply;

  await rememberMessage(session, 'assistant', finalReply);

  return {
    sessionId: activeSessionId,
    type: requiresIntake ? 'intake' : 'recommendation',
    symptomSummary: symptoms,
    followUpQuestion,
    reply: finalReply,
    products
  };
};

module.exports = {
  chatWithRag,
  syncKnowledgeBase
};
