const app = require('./app');
const serverConfig = require('./config/server.config');

app.listen(serverConfig.port, () => {
  console.log(`Server running in ${serverConfig.env} mode on port ${serverConfig.port}`);
});
