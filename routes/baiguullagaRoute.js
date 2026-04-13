const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Baiguullaga = require("../models/baiguullaga");
const Ajiltan = require("../models/ajiltan");
const { tokenShalgakh, crud, UstsanBarimt } = require("zevbackv2");
const axios = require("axios");
const request = require("request");
const NevtreltiinTuukh = require("../models/nevtreltiinTuukh");

crud(router, "baiguullaga", Baiguullaga, UstsanBarimt);
router.post("/baiguullagaBurtgekh", async (req, res, next) => {
  try {
    const { db } = require("zevbackv2");
    const baiguullaga = new Baiguullaga(db.erunkhiiKholbolt)(req.body);
    baiguullaga.isNew = !baiguullaga.zasakhEsekh;
    baiguullaga.barilguud = [
      {
        ner: baiguullaga.ner,
        khayag: baiguullaga.khayag,
        register: baiguullaga.register,
      },
    ];
    baiguullaga
      .save()
      .then(async (result) => {
        // test
        // db.kholboltNemye(
        //   baiguullaga._id,
        //   req.body.baaziinNer,
        //   true,
        //   "127.0.0.1:27017",
        //   "Br1stelback1",
        //   "admin",
        // );
        //production
        db.kholboltNemye(
          baiguullaga._id,
          req.body.baaziinNer,
          true,
          process.env.DB_HOST,
          process.env.DB_PASS,
          process.env.DB_USER,
        );
        if (req.body.ajiltan) {
          let ajiltan = new Ajiltan(db.erunkhiiKholbolt)(req.body.ajiltan);
          ajiltan.erkh = "Admin";
          ajiltan.baiguullagiinId = result._id;
          ajiltan.baiguullagiinNer = result.ner;
          ajiltan
            .save()
            .then((result1) => {
              res.send("Amjilttai");
            })
            .catch((err) => {
              next(err);
            });
        } else res.send("Amjilttai");
      })
      .catch((err) => {
        next(err);
      });
  } catch (error) {
    next(error);
  }
});

router.post("/salbarBurtgey", async (req, res, next) => {
  try {
    const { db } = require("zevbackv2");
    Baiguullaga(db.erunkhiiKholbolt)
      .findOneAndUpdate(
        { register: req.body.tolgoiCompany },
        {
          $push: {
            barilguud: {
              licenseRegister: req.body.register,
              ner: req.body.ner,
              khayag: req.body.khayag,
            },
          },
        },
        { new: true },
      )
      .then(async (result) => {
        res.send("Amjilttai");
      })
      .catch((err) => {
        next(err);
      });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/khyanakhSambariinUgugdulAvya",
  tokenShalgakh,
  (req, res, next) => {
    res.send({});
  },
);

router.post("/baiguullagaAvya", (req, res, next) => {
  const { db } = require("zevbackv2");
  Baiguullaga(db.erunkhiiKholbolt)
    .findOne({
      register: req.body.register,
    })
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      next(err);
    });
});

router.post("/moduliinMedeelelAvya", tokenShalgakh, async (req, res, next) => {
  try {
    var axiosKhariu = await axios.post(
      process.env.ADMIN_URL + "/moduliinMedeelelAvya",
      {
        register: req.body.register,
      },
    );
    if (axiosKhariu && axiosKhariu.data) res.send(axiosKhariu.data);
    else res.send("Мэдээлэл олдсонгүй!");
  } catch (err) {
    next(err);
  }
});
router.post(
  "/baiguullagaTokhirgooZasya",
  tokenShalgakh,
  async (req, res, next) => {
    try {
      const { db } = require("zevbackv2");
      if (!!req.body) {
        if (!mongoose.Types.ObjectId.isValid(req.body.baiguullagiinId)) {
          return next(
            new Error(
              "Буруу баигуулагын ID формат: " + req.body.baiguullagiinId,
            ),
          );
        }
        var update = {};
        for (var field in req.body.tokhirgoo) {
          if (field != "baiguullagiinId")
            update["tokhirgoo." + field] = req.body.tokhirgoo[field];
        }
        await Baiguullaga(db.erunkhiiKholbolt).findOneAndUpdate(
          { _id: req.body.baiguullagiinId },
          update,
        );
        res.send("Amjilttai");
      } else next(new aldaa("Засах боломжгүй байна"));
    } catch (error) {
      next(error);
    }
  },
);
router.post("/barilgaTokhirgooZasya", tokenShalgakh, async (req, res, next) => {
  try {
    const { db } = require("zevbackv2");
    const { baiguullagiinId, barilgaId, tokhirgoo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(baiguullagiinId)) {
      return next(new Error("Буруу байгуулагын ID: " + baiguullagiinId));
    }
    if (!mongoose.Types.ObjectId.isValid(barilgaId)) {
      return next(new Error("Буруу барилгын ID: " + barilgaId));
    }

    // Build update for the matching building inside barilguud array
    var update = {};
    for (var field in tokhirgoo) {
      update[`barilguud.$[elem].tokhirgoo.${field}`] = tokhirgoo[field];
    }

    await Baiguullaga(db.erunkhiiKholbolt).findOneAndUpdate(
      { _id: baiguullagiinId },
      { $set: update },
      {
        arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(barilgaId) }],
      },
    );

    res.send("Amjilttai");
  } catch (error) {
    next(error);
  }
});

router.post("/nevtreltiinTuukhAvya", tokenShalgakh, async (req, res, next) => {
  try {
    const { db } = require("zevbackv2");
    var khariu = await NevtreltiinTuukh(db.erunkhiiKholbolt).aggregate([
      {
        $group: { _id: "$baiguullagiinId", nevtersenOgnoo: { $max: "$ognoo" } },
      },
    ]);
    if (!!khariu && khariu.length > 0) {
      var baiguullaguud = await Baiguullaga(db.erunkhiiKholbolt).find({
        "barilguud.0": { $exists: true },
      });
      for (const element of khariu) {
        var baiguullaga = baiguullaguud.find(
          (x) => x._id.toString() == element._id,
        );
        if (!!baiguullaga) element.register = baiguullaga.register;
      }
      khariu = khariu.filter((x) => !!x.register);
    }
    res.send(khariu);
  } catch (error) {
    next(error);
  }
});

router.get("/tatvaraasBaiguullagaAvya/:regno", (req, res, next) => {
  var url = encodeURI(
    "https://api.ebarimt.mn/api/info/check/getTinInfo?regNo=" +
      req.params.regno,
  );
  request(url, { json: true }, (err, res1, body) => {
    if (err) next(err);
    else {
      url = encodeURI(
        "https://api.ebarimt.mn/api/info/check/getInfo?tin=" + body.data,
      );
      request(url, { json: true }, (err2, res2, body2) => {
        if (err2) next(err2);
        else res.send({ ...body2.data, tin: body.data });
      });
    }
  });
});

module.exports = router;
