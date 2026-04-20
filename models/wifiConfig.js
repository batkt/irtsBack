const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const wifiConfigSchema = new Schema(
  {
    baiguullagiinId: { type: String, required: true },
    barilgiinId: String,
    wifiNer: { type: String, required: true }, // SSID
    ipRange: [String], // ["192.168.1.0/24"]
    zuvshurulusenIp: [String], // Тодорхой IP-ууд
    idevkhitei: { type: Boolean, default: true },
  },
  { timestamps: true },
);
module.exports = function a(conn) {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  conn = conn.kholbolt;
  return conn.model("wifiConfig", wifiConfigSchema);
};
