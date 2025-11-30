require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/database');

const app = express();

// FINAL ALLOWED ORIGINS (NO LOCALHOST)
const allowedOrigins = [
  "https://sebastopol-gamma.vercel.app",
  "https://*.vercel.app",
  "https://sebastopol-academy-backend-production.up.railway.app"
];

console.log("🌍 CORS Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin.includes("*")) {
          const base = allowedOrigin.replace("*.", "");
          return origin.endsWith(base);
        }
        return origin === allowedOrigin;
      });

      if (allowed) {
        return callback(null, true);
      }

      console.log("❌ CORS BLOCKED:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.options("*", cors());

// SECURITY
app.use(helmet());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// CONNECT DB
connectDB();

// ROUTES
app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/lessons", require("./src/routes/lessons"));
app.use("/api/news", require("./src/routes/news"));

// HEALTH
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", time: new Date() });
});

// START SERVER
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

module.exports = app;
