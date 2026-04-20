const express = require("express");
const router = express.Router();
const {
  irtsBurtgel,
  getUnuudriinIrts,
  checkWifi,
} = require("../controllers/irtsController");
const { mobileOnlyGuard, wifiGuard } = require("../middleware/guards");
const {
  tokenShalgakh,
  crudWithFile,
  crud,
  UstsanBarimt,
  db,
} = require("zevbackv2");

router.post("/burtgel", mobileOnlyGuard, wifiGuard, irtsBurtgel);
router.post("/unuudriinIrtsAvya", tokenShalgakh, getUnuudriinIrts);
router.post("/check-wifi", tokenShalgakh, checkWifi);

module.exports = router;
