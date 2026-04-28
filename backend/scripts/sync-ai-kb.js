const { loadEnv } = require('../src/config/env');
const aiService = require('../src/modules/ai/ai.service');

const run = async () => {
  loadEnv();

  const force = process.argv.includes('--force');
  const result = await aiService.syncKnowledgeBase({ force });

  if (!result?.success) {
    console.error(`KB sync failed: ${result?.reason || 'unknown error'}`);
    process.exitCode = 1;
    return;
  }

  console.log('Pinecone KB sync completed.');
  console.log(`Index: ${result.indexName}`);
  console.log(`Knowledge docs: ${result.totalDocs}`);
  console.log(`Upserted vectors: ${result.upsertedCount}`);
  console.log(`Skipped vectors: ${result.skippedCount}`);
};

run().catch((error) => {
  console.error('KB sync crashed :', error.message);
  process.exitCode = 1;
});
