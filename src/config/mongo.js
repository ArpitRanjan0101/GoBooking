const { MongoClient } = require('mongodb');
const env = require('./env');

let client = null;
let db = null;

async function connectMongo() {
  client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  db = client.db();
  return db;
}

function getDB() {
  if (!db) {
    throw new Error('MongoDB has not been connected yet. Call connectMongo() first.');
  }
  return db;
}

module.exports = { connectMongo, getDB };
