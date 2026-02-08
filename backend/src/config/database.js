const { getEnv } = require("./env");

const databaseConfig = {
  DATABASE_URL: getEnv("DATABASE_URL", ""),
  validate() {
    if (!this.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for NeonDB");
    }
  }
};

module.exports = { databaseConfig };
