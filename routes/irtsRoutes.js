const express = require("express");
const router = express.Router();
const {
  irtsBurtgel,
  getUnuudriinIrts,
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
router.get("/unuudriinIrtsAvya", tokenShalgakh, getUnuudriinIrts);

module.exports = router;
