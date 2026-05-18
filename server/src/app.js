const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const coursesRoutes = require("./routes/courses.routes");
const modulesRoutes = require("./routes/modules.routes");
const lessonsRoutes = require("./routes/lessons.routes");
const assignmentsRoutes = require("./routes/assignments.routes");
const resourcesRoutes = require("./routes/resources.routes");
const progressRoutes = require("./routes/progress.routes");
const purchasesRoutes = require("./routes/purchases.routes");
const aiChatRoutes = require("./routes/aiChat.routes");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

const rateLimitHandler = (req, res) => {
  res.status(429).json({ error: "Too many requests. Please try again later." });
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const aiChatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const normalizeOrigin = (value) => String(value || "").replace(/\/$/, "");

const configuredClientOrigins = String(process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);

const allowedOrigins = [
  ...configuredClientOrigins,
  process.env.NODE_ENV !== "production" ? "http://localhost:5173" : null,
  process.env.NODE_ENV !== "production" ? "http://127.0.0.1:5173" : null,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.json({ success: true, message: "SkillFlow API работает" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "SkillFlow API" });
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/ai-chat", aiChatLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/ai-chat", aiChatRoutes);
app.use("/api", generalApiLimiter);
app.use("/api/users", usersRoutes);
app.use("/api", coursesRoutes);
app.use("/api", modulesRoutes);
app.use("/api", lessonsRoutes);
app.use("/api", assignmentsRoutes);
app.use("/api", resourcesRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/purchases", purchasesRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Маршрут не найден" });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Файл слишком большой. Максимальный размер аватара - 10 МБ.",
    });
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Ошибка сервера",
  });
});

module.exports = app;
