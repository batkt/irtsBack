const crypto = require("crypto");
const QrToken = require("../models/qrToken");

// QR token үүсгэх хугацаа (минутаар)
const QR_DURATION_MINUTES = 1;

const TURUL_LIST = ["oroh", "garoh", "tsai_oroh", "tsai_garoh"];

/**
 * Тухайн төрлийн шинэ QR token үүсгэх
 */
async function newToken(turul) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const duusakhTsag = new Date(now.getTime() + QR_DURATION_MINUTES * 60 * 1000);

  // Хуучин идэвхтэй token-уудыг хаах
  await QrToken.updateMany({ turul, idevkhitei: true }, { idevkhitei: false });

  const qr = await QrToken.create({ token, turul, ekhlesenTsag: now, duusakhTsag });
  return qr;
}

/**
 * Бүх төрлийн QR-уудыг rotate хийх (cron дуудна)
 */
async function rotateAllTokens() {
  const results = {};
  for (const turul of TURUL_LIST) {
    results[turul] = await newToken(turul);
  }
  console.log("[QR Rotate]", new Date().toISOString(), "- Шинэ token-ууд үүслээ");
  return results;
}

/**
 * Token шалгах
 */
async function validateToken(token) {
  const qr = await QrToken.findOne({
    token,
    idevkhitei: true,
    duusakhTsag: { $gt: new Date() },
  });
  return qr;
}

/**
 * Одоогийн идэвхтэй token-уудыг авах (admin дэлгэц)
 */
async function getActiveTokens() {
  return QrToken.find({
    idevkhitei: true,
    duusakhTsag: { $gt: new Date() },
  });
}

module.exports = { newToken, rotateAllTokens, validateToken, getActiveTokens };
