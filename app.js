/* eslint-disable global-require */
/* eslint-disable no-console */
const express = require('express');

const app = express();
const path = require('path');
const { socket } = require('./socket');
const { rateLimiter } = require('./utils/utils');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

const { NODE_ENV, PORT_TEST, PORT } = process.env;
const port = NODE_ENV === 'test' ? PORT_TEST : PORT;

const server = app.listen(port, () => {
  console.log(`app running on port ${port}`);
});

socket.init(server);

const apiVersion = process.env.API_VERSION;

app.use(`/${apiVersion}`, rateLimiter,
  [
    require('./server/route/user_route'),
    require('./server/route/share_route'),
    require('./server/route/automation_route'),
    require('./server/route/trip_route'),
  ]);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send('server error, please try again later');
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, './public', '404.html'));
});

module.exports = app;
