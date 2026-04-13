const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { createAdapter } = require("@socket.io/redis-adapter");
const { pubClient, subClient, connectRedis } = require("./utils/redisClient");
const server = http.Server(app);
const io = require("socket.io")(server, {
  pingTimeout: 20000,
  pingInterval: 10000,
});
const cron = require("node-cron");
const dotenv = require("dotenv");
dotenv.config({ path: "./tokhirgoo/tokhirgoo.env" });

const baiguullagaRoute = require("./routes/baiguullagaRoute");
const ajiltanRoute = require("./routes/ajiltanRoute");

const { db } = require("zevbackv2");

const aldaaBarigch = require("./middleware/aldaaBarigch");
process.setMaxListeners(0);
process.env.UV_THREADPOOL_SIZE = 20;
server.listen(8086);

process.env.TZ = "Asia/Ulaanbaatar";
app.set("socketio", io);
app.use(cors());
app.use(
  express.json({
    limit: "50mb",
    extended: true,
  }),
);
// test;
// db.kholboltUusgey(
//   app,
//   "mongodb://admin:Br1stelback1@127.0.0.1:27017/turees?authSource=admin",
// );

//production
db.kholboltUusgey(app, process.env.MONGODB_URI);

app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }),
);

app.use(baiguullagaRoute);
app.use(ajiltanRoute);
app.use(aldaaBarigch);

(async () => {
  // Redis холболт
  await connectRedis();

  // Socket.IO Redis adapter
  io.adapter(createAdapter(pubClient, subClient));

  console.log("✅ Socket.IO Redis adapter connected");
})();

io.on("connection", (socket) => {
  socket.on("disconnect", () => {});
  socket.on("error", () => socket.disconnect(true));
});
