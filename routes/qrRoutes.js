const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");
const { getActiveTokens, rotateAllTokens } = require("../services/qrService");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * GET /api/qr/active
 * Одоогийн идэвхтэй QR token-уудыг авах (admin)
 */
router.get("/active", async (req, res) => {
  try {
    const tokens = await getActiveTokens();
    const result = await Promise.all(
      tokens.map(async (t) => {
        const url = `${BASE_URL}/scan?token=${t.token}&turul=${t.turul}`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: "H",
          width: 300,
          margin: 2,
        });
        return {
          turul: t.turul,
          token: t.token,
          duusakhTsag: t.duusakhTsag,
          url,
          qrDataUrl,
        };
      })
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/qr/rotate
 * Бүх QR-уудыг шинэчлэх (cron эсвэл гараар)
 */
router.post("/rotate", async (req, res) => {
  try {
    await rotateAllTokens();
    res.json({ success: true, message: "QR token-ууд шинэчлэгдлээ." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
