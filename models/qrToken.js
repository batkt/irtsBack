const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const qrTokenSchema = new Schema({
  token: { type: String, required: true, unique: true },
  turul: {
    type: String,
    enum: ["oroh", "garoh", "tsai_oroh", "tsai_garoh"],
    required: true,
  },
  ekhlesenTsag: { type: Date, default: Date.now },
  duusakhTsag: { type: Date, required: true },
  idevkhitei: { type: Boolean, default: true },
}, { timestamps: true });

// TTL index - MongoDB автоматаар устгана
qrTokenSchema.index({ duusakhTsag: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("qrToken", qrTokenSchema);
