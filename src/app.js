const express = require('express');
const healthRoutes = require('./routes/health.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', healthRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
