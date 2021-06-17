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

const server = app.listen(4000, () => {
  console.log('app running on port 4000');
});

socket.init(server);

app.use('/', rateLimiter,
  [
    require('./server/route/user_route'),
    require('./server/route/share_route'),
    require('./server/route/trip_route'),
    require('./server/route/automation_route'),
  ]);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.log(err);
  res.sendStatus(500);
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, './public', '404.html'));
});
