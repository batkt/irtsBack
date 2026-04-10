const WifiConfig = require("../models/wifiConfig");

/**
 * 1. Зөвхөн утасны browser зөвшөөрөх
 */
function mobileOnlyGuard(req, res, next) {
  const ua = req.headers["user-agent"] || "";
  const isMobile =
    /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  if (!isMobile) {
    return res.status(403).json({
      success: false,
      message:
        "Энэ систем зөвхөн утаснаас хандах боломжтой. Компьютер болон web-ээр нэвтрэх боломжгүй.",
    });
  }
  next();
}

/**
 * 2. WiFi IP шалгах
 */
async function wifiGuard(req, res, next) {
  try {
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";

    const { baiguullagiinId } = req.body;
    if (!baiguullagiinId) {
      return res.status(400).json({ success: false, message: "baiguullagiinId шаардлагатай" });
    }

    const configs = await WifiConfig.find({ baiguullagiinId, idevkhitei: true });
    if (!configs.length) {
      // WiFi тохиргоо байхгүй бол өнгөрүүлэх
      return next();
    }

    const allowed = configs.some((cfg) => {
      if (cfg.zuvshurulusenIp?.includes(clientIp)) return true;
      if (cfg.ipRange?.some((range) => ipInRange(clientIp, range))) return true;
      return false;
    });

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Зөвшөөрөгдсөн WiFi сүлжээнд холбогдоогүй байна.",
        ip: clientIp,
      });
    }

    req.clientIp = clientIp;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * IP CIDR range шалгах туслах функц
 */
function ipInRange(ip, cidr) {
  try {
    const [range, bits] = cidr.split("/");
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    const ipInt = ip.split(".").reduce((a, b) => (a << 8) + parseInt(b), 0);
    const rangeInt = range.split(".").reduce((a, b) => (a << 8) + parseInt(b), 0);
    return (ipInt & mask) === (rangeInt & mask);
  } catch {
    return false;
  }
}

module.exports = { mobileOnlyGuard, wifiGuard };
