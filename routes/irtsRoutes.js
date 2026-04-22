const express = require("express");
const router = express.Router();
const {
  irtsBurtgel,
  getUnuudriinIrts,
  checkWifi,
  irtsBurtguulye,
  garsanTsagBurtguulye,
  ajillakhTsagAvya,
  irtsZasya,
  irtsiinMedeeSaraarAvya,
} = require("../controllers/irtsController");
const { mobileOnlyGuard, wifiGuard } = require("../middleware/guards");
const {
  tokenShalgakh,
  crudWithFile,
  crud,
  UstsanBarimt,
  db,
} = require("zevbackv2");
const Irts = require("../models/irts");

crud(router, "irts", Irts, UstsanBarimt);
router.post("/burtgel", mobileOnlyGuard, wifiGuard, irtsBurtgel);
router.post("/unuudriinIrtsAvya", tokenShalgakh, getUnuudriinIrts);
router.post("/check-wifi", tokenShalgakh, checkWifi);
router.post("/irtsBurtguulye", tokenShalgakh, irtsBurtguulye);
router.post("/garsanTsagBurtguulye", tokenShalgakh, garsanTsagBurtguulye);
router.post("/ajillakhTsagAvya", tokenShalgakh, ajillakhTsagAvya);
router.post("/irtsZasya", tokenShalgakh, irtsZasya);
router.post("/irtsiinMedeeSaraarAvya", tokenShalgakh, irtsiinMedeeSaraarAvya);

module.exports = router;
