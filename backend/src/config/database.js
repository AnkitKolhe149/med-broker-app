const { getEnv } = require("./env");

const databaseConfig = {
  get DATABASE_URL() {
    return getEnv("DATABASE_URL", "");
  },
  validate() {
    if (!this.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for NeonDB");
    }
  }
};

module.exports = { databaseConfig };
