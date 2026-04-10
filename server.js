require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");
const cors = require("cors");

const qrRoutes = require("./routes/qrRoutes");
const irtsRoutes = require("./routes/irtsRoutes");
const { rotateAllTokens } = require("./services/qrService");

const dotenv = require("dotenv");
dotenv.config({ path: "./tokhirgoo/tokhirgoo.env" });

const app = express();
// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/qr", qrRoutes);
app.use("/api/irts", irtsRoutes);

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// MongoDB холболт
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB холбогдлоо");

    // Эхэлмэгц QR үүсгэх
    await rotateAllTokens();

    // Цаг тутам QR rotate (жишээ: минут бүр)
    cron.schedule("* * * * *", async () => {
      await rotateAllTokens();
    });

    const PORT = process.env.PORT;
    app.listen(PORT, () => {
      console.log(`🚀 Server ажиллаж байна: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB холбогдож чадсангүй:", err.message);
    process.exit(1);
  });
