const Irts = require("../models/irts");
const WifiConfig = require("../models/wifiConfig");
const Baiguullaga = require("../models/baiguullaga");
const { validateToken } = require("../services/qrService");
const { allowedIPs } = require("../config/allowedIPs");

/**
 * Ирц бүртгэх
 * POST /api/irts/burtgel
 * Body: { token, ajiltniiId, ajiltniiNer, bairlal: [lat, lng], baiguullagiinId, barilgiinId }
 */
async function irtsBurtgel(req, res) {
  try {
    const {
      token,
      ajiltniiId,
      ajiltniiNer,
      bairlal,
      baiguullagiinId,
      barilgiinId,
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
            barilgiinId,
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
        if (!bichleg.tsainiiIrsenTsag) {
          bichleg.tsainiiIrsenTsag = odoo;
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
        if (!bichleg?.tsainiiIrsenTsag) {
          return res.status(400).json({
            success: false,
            message: "Цайны орсон бүртгэл олдсонгүй.",
          });
        }
        bichleg.tsainiiGarsanTsag = odoo;
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

async function checkWifi(req, res) {
  const { db } = require("zevbackv2");
  const isMobileCheck =
    /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      req.body.tokhiromjiinMedeelel?.userAgent,
    );

  if (!isMobileCheck)
    return res.json({
      zuvshurulusen: false,
      message: "Зөвхөн утасны интернэт хөтчөөр нэвтрэх боломжтой",
    });
  const { ip, buttonState, barilgiinId } = req.body;

  try {
    const wifiConfig = await WifiConfig(db.erunkhiiKholbolt).findOne({
      barilgiinId: barilgiinId,
      idevkhitei: true,
    });

    if (!wifiConfig) {
      return res.json({
        zuvshurulusen: false,
        message: "WiFi тохиргоо олдсонгүй",
      });
    }

    // Зөвхөн тодорхой IP шалгах
    const ipMatch = wifiConfig.zuvshurulusenIp.includes(ip);

    if (!ipMatch) {
      return res.json({ zuvshurulusen: false, message: "Зөвшөөрөгдөөгүй IP" });
    }

    return res.json({ zuvshurulusen: true, ip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ zuvshurulusen: false, message: "Серверийн алдаа" });
  }
}

async function irtsBurtguulye(req, res, next) {
  try {
    const {
      baiguullagiinId,
      barilgiinId,
      ip,
      tokhiromjiinMedeelel,
      tukhainBaaziinKholbolt,
      nevtersenAjiltniiToken,
      ajiltan,
      turul,
    } = req.body;
    console.log("irtsBurtguulye turul: ", turul);
    if (ajiltan?.erkh !== "Admin") {
      // IP зөв авах
      const rawIP =
        req.headers["x-real-ip"] || // Nginx жинхэнэ IP
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.socket.remoteAddress;

      const ip = rawIP?.replace("::ffff:", "");

      console.log("X-Real-IP:", req.headers["x-real-ip"]);
      console.log("X-Forwarded-For:", req.headers["x-forwarded-for"]);
      console.log("Жинхэнэ IP:", ip);

      const isMobile =
        /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
          tokhiromjiinMedeelel?.userAgent,
        );
      console.log("IP: ", ip);
      console.log("isMobile: ", isMobile);
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geo = await geoRes.json();
      console.log("Улс:", geo.country);
      console.log("Хот:", geo.city);
      console.log("ISP (интернэт үүсгэл):", geo.isp); // "MobiCom", "Unitel" гэх мэт
      console.log("Байгууллага:", geo.org);
      if (!isMobile)
        throw new aldaa("Зөвхөн утасны интернэт хөтчөөр нэвтрэх боломжтой");
      if (!allowedIPs.includes(ip))
        throw new aldaa("Зөвхөн оффисын сүлжээнээс нэвтрэх боломжтой");
    }

    // UserAgent-аас утасны төрөл тодорхойлох
    const isMobile = /iPhone|iPad|iPod|Android/i.test(
      tokhiromjiinMedeelel.userAgent,
    );
    const isAndroid = /Android/i.test(tokhiromjiinMedeelel.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(tokhiromjiinMedeelel.userAgent);
    const isMobileCheck =
      /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        tokhiromjiinMedeelel.userAgent,
      );
    const { db } = require("zevbackv2");
    if (!isMobileCheck)
      throw new aldaa("Зөвхөн утасны интернэт хөтчөөр нэвтрэх боломжтой");
    var unuudur = new Date();
    var unuudriinIrts = await Irts(tukhainBaaziinKholbolt).findOne({
      ognoo: new Date(
        unuudur.getFullYear(),
        unuudur.getMonth(),
        unuudur.getDate(),
      ),
      ajiltniiId: nevtersenAjiltniiToken.id,
      baiguullagiinId: baiguullagiinId,
      barilgiinId: barilgiinId,
    });
    if (unuudriinIrts) throw new Error("Өнөөдрийн ирц бүртгэгдсэн байна!");
    const wifiConfig = await WifiConfig(db.erunkhiiKholbolt).findOne({
      barilgiinId: barilgiinId,
      idevkhitei: true,
    });

    if (!wifiConfig) {
      return res.json({
        zuvshurulusen: false,
        message: "WiFi тохиргоо олдсонгүй",
      });
    }

    // Зөвхөн тодорхой IP шалгах
    const ipMatch = wifiConfig.zuvshurulusenIp.includes(ip);

    if (!ipMatch) {
      return res.json({ zuvshurulusen: false, message: "Зөвшөөрөгдөөгүй IP" });
    }
    var baiguullaga = await Baiguullaga(db.erunkhiiKholbolt).findById(
      baiguullagiinId,
    );
    var barilga = await baiguullaga.barilguud.find((a) => a._id == barilgiinId);
    var ajillakhUdur = barilga.ajillakhUdruud.find((a) => {
      return a.udruud.includes(unuudur.getDay().toString());
    });
    var ekhlekhTsag = new Date(
      unuudur.getFullYear(),
      unuudur.getMonth(),
      unuudur.getDate(),
      ajillakhUdur.neekhTsag.substring(0, 2),
      ajillakhUdur.neekhTsag.substring(3),
      0,
      0,
    );
    var irts = new Irts(tukhainBaaziinKholbolt)();
    irts.ajiltniiId = nevtersenAjiltniiToken.id;
    irts.ajiltniiNer = nevtersenAjiltniiToken.ner;
    irts.irsenTsag = new Date();
    irts.ognoo = new Date(
      unuudur.getFullYear(),
      unuudur.getMonth(),
      unuudur.getDate(),
    );
    if (irts.irsenTsag > ekhlekhTsag) {
      var khotsorson = irts.irsenTsag - ekhlekhTsag;
      irts.khotsorsonMinut = Math.floor(khotsorson / 1000 / 60);
      irts.turul = "khotsorson";
    } else if (irts.irsenTsag < ekhlekhTsag) {
      var ertIrsen = ekhlekhTsag - irts.irsenTsag;
      irts.ertIrsenMinut = Math.floor(ertIrsen / 1000 / 60);
    }
    irts.baiguullagiinId = baiguullagiinId;
    irts.barilgiinId = barilgiinId;
    irts.tokhiromjiinMedeelel = {
      ...tokhiromjiinMedeelel,
      isMobile,
      isAndroid,
      isIOS,
    };
    irts.save();
    res.send("Amjilttai");
  } catch (err) {
    next(err);
  }
}

async function garsanTsagBurtguulye(req, res, next) {
  try {
    const {
      baiguullagiinId,
      barilgiinId,
      ip,
      tokhiromjiinMedeelel,
      tukhainBaaziinKholbolt,
      nevtersenAjiltniiToken,
      ajiltan,
      turul,
    } = req.body;
    console.log("irtsBurtguulye turul: ", turul);
    if (ajiltan?.erkh !== "Admin") {
      // IP зөв авах
      const rawIP =
        req.headers["x-real-ip"] || // Nginx жинхэнэ IP
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.socket.remoteAddress;

      const ip = rawIP?.replace("::ffff:", "");

      console.log("X-Real-IP:", req.headers["x-real-ip"]);
      console.log("X-Forwarded-For:", req.headers["x-forwarded-for"]);
      console.log("Жинхэнэ IP:", ip);

      const isMobile =
        /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
          tokhiromjiinMedeelel?.userAgent,
        );
      console.log("IP: ", ip);
      console.log("isMobile: ", isMobile);
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geo = await geoRes.json();
      console.log("Улс:", geo.country);
      console.log("Хот:", geo.city);
      console.log("ISP (интернэт үүсгэл):", geo.isp); // "MobiCom", "Unitel" гэх мэт
      console.log("Байгууллага:", geo.org);
      if (!isMobile)
        throw new aldaa("Зөвхөн утасны интернэт хөтчөөр нэвтрэх боломжтой");
      if (!allowedIPs.includes(ip))
        throw new aldaa("Зөвхөн оффисын сүлжээнээс нэвтрэх боломжтой");
    }
    // UserAgent-аас утасны төрөл тодорхойлох
    const isMobile = /iPhone|iPad|iPod|Android/i.test(
      tokhiromjiinMedeelel.userAgent,
    );
    const isAndroid = /Android/i.test(tokhiromjiinMedeelel.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(tokhiromjiinMedeelel.userAgent);
    const isMobileCheck =
      /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        tokhiromjiinMedeelel.userAgent,
      );
    const { db } = require("zevbackv2");
    if (!isMobileCheck)
      throw new aldaa("Зөвхөн утасны интернэт хөтчөөр нэвтрэх боломжтой");
    var unuudur = new Date();
    var unuudriinIrts = await Irts(tukhainBaaziinKholbolt).findOne({
      ognoo: new Date(
        unuudur.getFullYear(),
        unuudur.getMonth(),
        unuudur.getDate(),
      ),
      ajiltniiId: nevtersenAjiltniiToken.id,
      baiguullagiinId: baiguullagiinId,
      barilgiinId: barilgiinId,
    });
    if (unuudriinIrts && unuudriinIrts.yawsanTsag)
      throw new Error("Өнөөдрийн гарсан цаг бүртгэгдсэн байна!");
    else if (!unuudriinIrts)
      throw new Error(
        "Өнөөдрийн ирсэн цаг бүртгэгдээгүй тул гарсан цаг бүртгэх боломжгүй!",
      );
    var baiguullaga = await Baiguullaga(db.erunkhiiKholbolt)
      .findById(baiguullagiinId)
      .lean();
    var barilga = await baiguullaga.barilguud.find((a) => a._id == barilgiinId);
    var ajillakhUdur = barilga.ajillakhUdruud.find((a) => {
      return a.udruud.includes(unuudur.getDay().toString());
    });
    if (turul === "garakh") {
      var tarsanTsag = new Date();
      unuudriinIrts.yawsanTsag = tarsanTsag;
      var khaakhTsag = new Date(
        unuudur.getFullYear(),
        unuudur.getMonth(),
        unuudur.getDate(),
        ajillakhUdur.khaakhTsag.substring(0, 2),
        ajillakhUdur.khaakhTsag.substring(3),
        0,
        0,
      );
      if (tarsanTsag > khaakhTsag)
        unuudriinIrts.ajillasanMinut =
          Math.floor(khaakhTsag / 1000 / 60) -
          Math.floor(unuudriinIrts.irsenTsag / 1000 / 60);
      else {
        if (unuudriinIrts.khotsorsonMinut == 0)
          unuudriinIrts.tuluv == "kheviin";
        unuudriinIrts.ajillasanMinut =
          Math.floor(tarsanTsag / 1000 / 60) -
          Math.floor(unuudriinIrts.irsenTsag / 1000 / 60);
      }
      unuudriinIrts.tokhiromjiinMedeelelGarsan = {
        ...tokhiromjiinMedeelel,
        isMobile,
        isAndroid,
        isIOS,
      };
    } else if (turul === "tsainiiGarakh") {
      unuudriinIrts.tsainiiGarsanTsag = new Date();
      unuudriinIrts.tokhiromjiinMedeelelTsainiiTsagGarsan = {
        ...tokhiromjiinMedeelel,
        isMobile,
        isAndroid,
        isIOS,
      };
    } else if (turul === "tsainiiOrokh") {
      unuudriinIrts.tsainiiIrsenTsag = new Date();
      var khaakhTsag = new Date(
        unuudur.getFullYear(),
        unuudur.getMonth(),
        unuudur.getDate(),
        ajillakhUdur.tsainiiKhaakhTsag.substring(0, 2),
        ajillakhUdur.tsainiiKhaakhTsag.substring(3),
        0,
        0,
      );
      if (unuudriinIrts.tsainiiIrsenTsag > khaakhTsag) {
        var khotsorson = unuudriinIrts.tsainiiIrsenTsag - khaakhTsag;
        unuudriinIrts.khotsorsonMinutTsainiiTsag = Math.floor(
          khotsorson / 1000 / 60,
        );
        unuudriinIrts.turul = "khotsorsonTsainiiTsag";
      } else if (unuudriinIrts.tsainiiIrsenTsag < khaakhTsag) {
        var ertIrsen = khaakhTsag - unuudriinIrts.tsainiiIrsenTsag;
        unuudriinIrts.ertIrsenMinutTsainiiTsag = Math.floor(
          ertIrsen / 1000 / 60,
        );
      }
      unuudriinIrts.tokhiromjiinMedeelelTsainiiTsagIrsen = {
        ...tokhiromjiinMedeelel,
        isMobile,
        isAndroid,
        isIOS,
      };
    }
    unuudriinIrts.isNew = false;
    unuudriinIrts.save();
    res.send("Amjilttai");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  irtsBurtgel,
  getUnuudriinIrts,
  checkWifi,
  irtsBurtguulye,
  garsanTsagBurtguulye,
};
