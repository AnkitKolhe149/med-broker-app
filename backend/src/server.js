const { loadEnv } = require("./config/env");
const { databaseConfig } = require("./config/database");
const { startExchangeRateScheduler } = require("./jobs/exchangeRate.job");

loadEnv();
databaseConfig.validate();

const { app } = require("./app");

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
  startExchangeRateScheduler();
});
