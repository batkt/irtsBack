const { createClient } = require("redis");

const redisUrl = "redis://127.0.0.1:6379";

const pubClient = createClient({ url: redisUrl });
const subClient = pubClient.duplicate();

async function connectRedis() {
  if (!pubClient.isOpen) {
    await pubClient.connect();
  }
  if (!subClient.isOpen) {
    await subClient.connect();
  }
}

module.exports = {
  pubClient,
  subClient,
  connectRedis,
};