const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { errorHandler } = require("./middlewares/error.middleware");
const { prisma } = require("./database/prisma");

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// Enhanced health check with database status
app.get("/health", async (req, res) => {
  let dbStatus = 'disconnected';
  let dbLatency = null;
  
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - start;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
  }
  
  res.json({ 
    status: "ok",
    database: dbStatus,
    latency: dbLatency !== null ? `${dbLatency}ms` : null,
    timestamp: new Date().toISOString()
  });
});

app.use("/api", routes);

app.use(errorHandler);

module.exports = { app };
