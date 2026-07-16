const express = require('express');
const healthRoutes = require('./routes/health.routes');
const apiRoutes = require('./routes/index');
const notFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const { UPLOAD_ROOT } = require('./config/upload.config');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(UPLOAD_ROOT));

app.use('/', healthRoutes);
app.use('/api/v1', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
