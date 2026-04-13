const http = require("http");
const Baiguullaga = require("../models/baiguullaga");
async function aldaagIlgeeye(aldaa, req) {
  const { db } = require("zevbackv2");
  var baiguullaga = await Baiguullaga(db.erunkhiiKholbolt).findById(
    req.body.baiguullagiinId,
  );

  const data = new TextEncoder().encode(
    JSON.stringify({
      system: "irts",
      aldaa: aldaa,
      aldaaniiMsg: aldaa.message,
      ognoo: new Date(),
      baiguullagiinNer: baiguullaga?.ner,
      baiguullagiinId: req.body.baiguullagiinId,
      burtgesenAjiltaniiId: req.body.nevtersenAjiltniiToken.id,
      burtgesenAjiltaniiNer: req.body.nevtersenAjiltniiToken.ner,
    }),
  );
  const options = {
    hostname: "admin.zevtabs.mn",
    port: 443,
    path: "/api/aldaa",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const request = http.request(options, (response) => {
    response.on("data", (d) => {});
  });
  request.on("error", (error) => {});

  request.write(data);
  request.end();
}
const aldaaBarigch = (err, req, res, next) => {
  try {
    if (res.headersSent) {
      return next(err);
    }

    if (req.body && req.body.nevtersenAjiltniiToken) aldaagIlgeeye(err, req);
    if (!!err.message && err.message.includes("indexTalbar_1 dup key"))
      err.message = "Нэвтрэх нэр давхардаж байна!";
    else if (
      !!err.message &&
      !!err.message.includes("connect ECONNREFUSED admin.zevtabs.mn")
    ) {
      err.message = " Лицензийн хэсэгтэй холбогдоход алдаа гарлаа!";
    }
    res.status(err.kod || 500).json({
      success: false,
      aldaa: err.message,
    });
  } catch (error) {
    if (res.headersSent) {
      return next(error);
    }
    try {
      res.status(500).json({
        success: false,
        aldaa: error.message || "Алдаа гарлаа",
      });
    } catch (sendError) {
      if (!!next) next(error);
    }
  }
};

module.exports = aldaaBarigch;
