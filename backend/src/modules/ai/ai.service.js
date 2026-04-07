const { randomUUID } = require('node:crypto');
const knowledgeBase = require('./knowledge.base.json');
const { prisma } = require('../../database/prisma');
const { Pinecone } = require('@pinecone-database/pinecone');

const chatSessions = new Map();
const MAX_SESSION_MESSAGES = 20;

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
  'cough',
  'cold',
  'sore throat',
  'runny nose',
  'acidity',
  'heartburn',
  'indigestion',
  'allergy',
  'itching',
  'rash',
  'vomiting',
  'diarrhea'
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
  return SYMPTOM_KEYWORDS.filter((symptom) => normalized.includes(symptom));
};

const getSessionState = (sessionId) => {
  const existing = chatSessions.get(sessionId);
  if (existing) return existing;

  const created = {
    symptoms: new Set(),
    messages: []
  };
  chatSessions.set(sessionId, created);
  return created;
};

const rememberMessage = (state, role, text) => {
  state.messages.push({ role, text, createdAt: Date.now() });
  if (state.messages.length > MAX_SESSION_MESSAGES) {
    state.messages.shift();
  }
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
          content: 'You are MedIQ symptom assistant. Never diagnose. First ensure safety. Use only context. Recommend platform products only if relevant and in stock. Keep response concise and clear.'
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

const mapToProducts = async ({ retrievedDocs, symptoms, buyerType = 'RETAIL' }) => {
  const keywordSet = new Set();
  retrievedDocs.forEach((doc) => {
    (doc.metadata?.productKeywords || []).forEach((keyword) => keywordSet.add(String(keyword).toLowerCase()));
  });

  symptoms.forEach((symptom) => keywordSet.add(symptom));

  const keywords = [...keywordSet].slice(0, 8);

  const whereOr = keywords.map((keyword) => ({
    medicine: {
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } }
      ]
    }
  }));

  const inventoryItems = await prisma.inventory.findMany({
    where: {
      quantity: { gt: 0 },
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
    orderBy: { quantity: 'desc' },
    take: 5
  });

  return inventoryItems.map((item) => {
    const retailPrice = Number(((item.medicine.priceCents || 0) / 100).toFixed(2));
    const wholesalePrice = Number((((item.medicine.wholesalePriceCents ?? item.medicine.priceCents) || 0) / 100).toFixed(2));
    const bulkPrice = Number((((item.medicine.bulkPriceCents ?? item.medicine.wholesalePriceCents ?? item.medicine.priceCents) || 0) / 100).toFixed(2));
    const bulkMinQty = item.medicine.bulkMinQty || 1;

    const defaultPrice = buyerType === 'WHOLESALE' ? wholesalePrice : retailPrice;

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
      displayPrice: defaultPrice,
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
  const session = getSessionState(activeSessionId);

  rememberMessage(session, 'user', message);

  const extractedSymptoms = extractSymptoms(message);
  extractedSymptoms.forEach((symptom) => session.symptoms.add(symptom));

  if (hasRedFlags(message)) {
    const reply = 'Your symptoms may indicate a medical emergency. Please seek urgent in-person medical care or call emergency services immediately.';
    rememberMessage(session, 'assistant', reply);

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
  const products = await mapToProducts({ retrievedDocs, symptoms, buyerType });

  const requiresIntake = symptoms.length < 2;
  const llmReply = await createLLMReply({
    userMessage: message,
    retrievedDocs,
    symptoms,
    products
  });

  const followUpQuestion = buildFollowUpQuestion(retrievedDocs);

  const finalReply = requiresIntake
    ? `${llmReply}\n\n${followUpQuestion}`
    : llmReply;

  rememberMessage(session, 'assistant', finalReply);

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
