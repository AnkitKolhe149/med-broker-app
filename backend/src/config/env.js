const path = require("path");
const dotenv = require("dotenv");

let loaded = false;

const loadEnv = () => {
  if (loaded) {
    return;
  }

  dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });
  loaded = true;
};

const getEnv = (key, defaultValue = undefined) => {
  const value = process.env[key];
  if (value === undefined || value === "") {
    return defaultValue;
  }

  return value;
};

module.exports = { loadEnv, getEnv };
