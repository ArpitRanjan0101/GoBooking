const { createClient } = require('redis');
const env = require('./env');

let client = null;

async function connectRedis() {
  client = createClient({ url: env.REDIS_URL });
  await client.connect();
  return client;
}

function getRedisClient() {
  if (!client) {
    throw new Error('Redis has not been connected yet. Call connectRedis() first.');
  }
  return client;
}

module.exports = { connectRedis, getRedisClient };
