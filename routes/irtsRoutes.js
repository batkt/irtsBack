const express = require("express");
const router = express.Router();
const {
  irtsBurtgel,
  getUnuudriinIrts,
  checkWifi,
  irtsBurtguulye,
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
router.post("/irtsBurtguulye", tokenShalgakh, irtsBurtguulye);

// router.post("/garsanTsagBurtguulye", tokenShalgakh, async (req, res, next) => {
//   try {
//     var bairshil = req.body.bairshil;
//     var suljeeniiMacKhayag = req.body.suljeeniiMacKhayag;
//     if (
//       (!suljeeniiMacKhayag || suljeeniiMacKhayag == "02:00:00:00:00:00") &&
//       (!bairshil ||
//         !Array.isArray(bairshil) ||
//         bairshil.length != 2 ||
//         bairshil[0] == null ||
//         bairshil[0] == undefined ||
//         bairshil[1] == null ||
//         bairshil[1] == undefined)
//     )
//       throw new Error(
//         "Та байршлын мэдээллийг асаах эсвэл ажлын интернет сүлжээнд холбогдож ирцээ бүртгүүлэх боломжтой!",
//       );
//     var unuudur = new Date();
//     var unuudriinIrts = await Irts.findOne({
//       ognoo: new Date(
//         unuudur.getFullYear(),
//         unuudur.getMonth(),
//         unuudur.getDate(),
//       ),
//       ajiltniiId: req.body.nevtersenAjiltniiToken.id,
//       baiguullagiinId: req.body.baiguullagiinId,
//     });
//     if (unuudriinIrts && unuudriinIrts.yawsanTsag)
//       throw new Error("Өнөөдрийн гарсан цаг бүртгэгдсэн байна!");
//     else if (!unuudriinIrts)
//       throw new Error(
//         "Өнөөдрийн ирсэн цаг бүртгэгдээгүй тул гарсан цаг бүртгэх боломжгүй!",
//       );
//     var baiguullaga = await Baiguullaga.findById(
//       req.body.baiguullagiinId,
//     ).lean();
//     var salbar = {};
//     var tukhainTukhuurumj = await Tukhuurumj.findOne({
//       baiguullagiinId: req.body.baiguullagiinId,
//       macKhayag: suljeeniiMacKhayag,
//     });
//     if (tukhainTukhuurumj) {
//       salbar = await baiguullaga.salbaruud.find(
//         (a) => a._id == tukhainTukhuurumj.salbariinId,
//       );
//     }
//     if (!tukhainTukhuurumj && bairshil) {
//       if (bairshil == [null, null]) {
//         throw new Error(
//           "Та ажлын интернет сүлжээнд холбогдож ирцээ бүртгүүлэх боломжтой!",
//         );
//       }
//       var ObjectId = require("mongodb").ObjectId;
//       var agg = await Baiguullaga.aggregate([
//         {
//           $geoNear: {
//             near: {
//               type: "Point",
//               coordinates: bairshil,
//             },
//             distanceField: "zai",
//             maxDistance: 200,
//             includeLocs: "oldsonBairshil",
//           },
//         },
//         {
//           $match: {
//             _id: new ObjectId(req.body.baiguullagiinId),
//           },
//         },
//       ]);
//       if (!agg || agg.length == 0 || agg[0].zai > 200)
//         throw new Error("Зөвхөн ажлын байр дээрээс бүртгэл хийх боломжтой!");
//       salbar = await baiguullaga.salbaruud.find(
//         (a) =>
//           a.bairshil.coordinates[0] == agg[0].oldsonBairshil.coordinates[0] &&
//           a.bairshil.coordinates[1] == agg[0].oldsonBairshil.coordinates[1],
//       );
//     }
//     var ajillakhUdur = salbar.ajillakhUdruud.find((a) => {
//       return a.udruud.includes(unuudur.getDay().toString());
//     });
//     var tarsanTsag = new Date();
//     unuudriinIrts.yawsanTsag = tarsanTsag;
//     var khaakhTsag = new Date(
//       unuudur.getFullYear(),
//       unuudur.getMonth(),
//       unuudur.getDate(),
//       ajillakhUdur.khaakhTsag.substring(0, 2),
//       ajillakhUdur.khaakhTsag.substring(3),
//       0,
//       0,
//     );
//     if (tarsanTsag > khaakhTsag)
//       unuudriinIrts.ajillasanMinut =
//         Math.floor(khaakhTsag / 1000 / 60) -
//         Math.floor(unuudriinIrts.irsenTsag / 1000 / 60);
//     else {
//       if (unuudriinIrts.khotsorsonMinut == 0) unuudriinIrts.tuluv == "kheviin";
//       unuudriinIrts.ajillasanMinut =
//         Math.floor(tarsanTsag / 1000 / 60) -
//         Math.floor(unuudriinIrts.irsenTsag / 1000 / 60);
//     }
//     if (tukhainTukhuurumj)
//       unuudriinIrts.garsanTurul = {
//         tukhuruumjiinId: tukhainTukhuurumj._id,
//       };
//     else
//       unuudriinIrts.garsanTurul = {
//         bairlal: bairshil,
//         zai: agg[0].zai,
//       };
//     unuudriinIrts.isNew = false;
//     unuudriinIrts.save();
//     res.send("Amjilttai");
//   } catch (err) {
//     next(err);
//   }
// });

module.exports = router;
