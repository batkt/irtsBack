const Irts = require("../models/irts");
const { validateToken } = require("../services/qrService");

/**
 * Ирц бүртгэх
 * POST /api/irts/burtgel
 * Body: { token, ajiltniiId, ajiltniiNer, bairlal: [lat, lng], baiguullagiinId, salbariinId }
 */
async function irtsBurtgel(req, res) {
  try {
    const {
      token,
      ajiltniiId,
      ajiltniiNer,
      bairlal,
      baiguullagiinId,
      salbariinId,
    } = req.body;

    // 1. QR token шалгах
    const qr = await validateToken(token);
    if (!qr) {
      return res.status(400).json({
        success: false,
        message: "QR код хүчингүй болсон байна. Шинэ QR уншина уу.",
      });
    }

    const odoo = new Date();
    const ognooStart = new Date(odoo);
    ognooStart.setHours(0, 0, 0, 0);
    const ognooEnd = new Date(odoo);
    ognooEnd.setHours(23, 59, 59, 999);

    // 2. Өнөөдрийн бичлэг хайх
    let bichleg = await Irts.findOne({
      ajiltniiId,
      baiguullagiinId,
      ognoo: { $gte: ognooStart, $lte: ognooEnd },
    });

    const burtgesenTurul = {
      ajiltniiId,
      ajiltniiNer,
      burtgesenTsag: odoo,
      tukhuruumjiinId: req.headers["user-agent"] || "",
      bairlal: bairlal || [],
      zai: 0,
    };

    switch (qr.turul) {
      case "oroh": {
        if (bichleg?.irsenTsag) {
          return res.status(400).json({
            success: false,
            message: "Өнөөдөр аль хэдийн ирсэн бүртгэгдсэн байна.",
          });
        }

        // Хоцрол тооцоолох (08:30 стандарт)
        const standartIreh = new Date(odoo);
        standartIreh.setHours(8, 30, 0, 0);
        const khotsorsonMinut = Math.max(
          0,
          Math.round((odoo - standartIreh) / 60000),
        );
        const ertIrsenMinut = Math.max(
          0,
          Math.round((standartIreh - odoo) / 60000),
        );

        if (bichleg) {
          bichleg.irsenTsag = odoo;
          bichleg.khotsorsonMinut = khotsorsonMinut;
          bichleg.ertIrsenMinut = ertIrsenMinut;
          bichleg.orsonTurul = burtgesenTurul;
          bichleg.tuluv = khotsorsonMinut > 0 ? "khotorson" : "tsag_tuhaidaa";
        } else {
          bichleg = new Irts({
            ajiltniiId,
            ajiltniiNer,
            ognoo: odoo,
            irsenTsag: odoo,
            khotsorsonMinut,
            ertIrsenMinut,
            orsonTurul: burtgesenTurul,
            tuluv: khotsorsonMinut > 0 ? "khotorson" : "tsag_tuhaidaa",
            baiguullagiinId,
            salbariinId,
          });
        }
        await bichleg.save();
        return res.json({
          success: true,
          message: "Ирсэн бүртгэгдлээ.",
          turul: "oroh",
          tsag: odoo,
          khotsorsonMinut,
        });
      }

      case "garoh": {
        if (!bichleg?.irsenTsag) {
          return res.status(400).json({
            success: false,
            message: "Өнөөдрийн ирсэн бүртгэл олдсонгүй.",
          });
        }
        if (bichleg.yawsanTsag) {
          return res.status(400).json({
            success: false,
            message: "Өнөөдөр аль хэдийн гарсан бүртгэгдсэн байна.",
          });
        }
        const ajillasanMinut = Math.round((odoo - bichleg.irsenTsag) / 60000);
        bichleg.yawsanTsag = odoo;
        bichleg.ajillasanMinut = ajillasanMinut;
        bichleg.garsanTurul = burtgesenTurul;
        await bichleg.save();
        return res.json({
          success: true,
          message: "Гарсан бүртгэгдлээ.",
          turul: "garoh",
          tsag: odoo,
          ajillasanMinut,
        });
      }

      case "tsai_oroh": {
        if (!bichleg?.irsenTsag) {
          return res.status(400).json({
            success: false,
            message: "Эхлээд ирсэн бүртгэлтэй байх ёстой.",
          });
        }
        // Цайны завсарлага тэмдэглэх
        if (!bichleg.tsaiOrsonTsag) {
          bichleg.tsaiOrsonTsag = odoo;
          await bichleg.save();
        }
        return res.json({
          success: true,
          message: "Цайны цагаар орсон бүртгэгдлээ.",
          turul: "tsai_oroh",
          tsag: odoo,
        });
      }

      case "tsai_garoh": {
        if (!bichleg?.tsaiOrsonTsag) {
          return res.status(400).json({
            success: false,
            message: "Цайны орсон бүртгэл олдсонгүй.",
          });
        }
        bichleg.tsaiGarsanTsag = odoo;
        await bichleg.save();
        return res.json({
          success: true,
          message: "Цайны цагаас гарсан бүртгэгдлээ.",
          turul: "tsai_garoh",
          tsag: odoo,
        });
      }

      default:
        return res
          .status(400)
          .json({ success: false, message: "Тодорхойгүй QR төрөл." });
    }
  } catch (err) {
    console.error("[irtsBurtgel]", err);
    res.status(500).json({ success: false, message: "Серверийн алдаа." });
  }
}

async function getUnuudriinIrts(req, res, next) {
  try {
    if (!req.body.nevtersenAjiltniiToken || !req.body.nevtersenAjiltniiToken.id)
      throw Error("Токены мэдээлэл дутуу байна!");
    var unuudur = new Date();
    var unuudriinIrts = await Irts(req.body.tukhainBaaziinKholbolt).findOne({
      ognoo: new Date(
        unuudur.getFullYear(),
        unuudur.getMonth(),
        unuudur.getDate(),
      ),
      ajiltniiId: req.body.nevtersenAjiltniiToken.id,
      baiguullagiinId: req.body.baiguullagiinId,
    });
    console.log("[getUnuudriinIrts] unuudriinIrts", unuudriinIrts);
    res.send(unuudriinIrts);
  } catch (err) {
    console.log("[getUnuudriinIrts] err", err);
    next(err);
  }
}

module.exports = { irtsBurtgel, getUnuudriinIrts };
