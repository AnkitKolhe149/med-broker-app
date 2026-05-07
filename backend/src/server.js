const { loadEnv } = require("./config/env");
loadEnv();

const { databaseConfig } = require("./config/database");
const { startExchangeRateScheduler } = require("./jobs/exchangeRate.job");
const { initializeSettings } = require("./utils/seedSystemSettings");

databaseConfig.validate();

const { app } = require("./app");

const port = process.env.PORT || 4005; // Trigger Nodemon Reset Final

// Bind to IPv6 unspecified address to accept IPv6 connections explicitly.
// On many systems this will also accept IPv4-mapped addresses.
app.listen(port, '::', async () => {
  console.log(`API server listening on port ${port}`);
  
  // ✅ Initialize system settings on app startup
  await initializeSettings();
  
  startExchangeRateScheduler();
});
