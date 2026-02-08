const { app } = require("./app");
const { loadEnv } = require("./config/env");
const { databaseConfig } = require("./config/database");

loadEnv();
databaseConfig.validate();

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
