const env = require('./env');

const serverConfig = {
  port: env.PORT,
  env: env.NODE_ENV,
};

module.exports = serverConfig;
