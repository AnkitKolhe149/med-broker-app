const { loadEnv } = require("./config/env");
loadEnv();

const { databaseConfig } = require("./config/database");
const { startExchangeRateScheduler } = require("./jobs/exchangeRate.job");

databaseConfig.validate();

const { app } = require("./app");

const port = process.env.PORT || 4005; // Trigger Nodemon Reset Final

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
  startExchangeRateScheduler();
});
