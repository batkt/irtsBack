const express = require("express");
const router = express.Router();
const { irtsBurtgel } = require("../controllers/irtsController");
const { mobileOnlyGuard, wifiGuard } = require("../middleware/guards");

/**
 * POST /api/irts/burtgel
 * QR-аар ирц бүртгэх
 * Шалгуур: утас ✓ → WiFi IP ✓ → бүртгэл
 */
router.post("/burtgel", mobileOnlyGuard, wifiGuard, irtsBurtgel);

module.exports = router;
