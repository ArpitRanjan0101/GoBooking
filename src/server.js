const app = require('./app');
const serverConfig = require('./config/server.config');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');

async function startServer() {
  try {
    await connectDB();
    await connectRedis();

    app.listen(serverConfig.port, () => {
      console.log(`Server running in ${serverConfig.env} mode on port ${serverConfig.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
