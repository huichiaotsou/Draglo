const { promisify } = require('util');
const redis = require('redis');

const client = redis.createClient({
  host: 'localhost',
  port: 6379,
});

client.on('ready', () => {
  console.log('redis is ready');
});

client.on('error', () => {
  console.log('redis error');
});

const set = promisify(client.set).bind(client);
const get = promisify(client.get).bind(client);
const del = promisify(client.del).bind(client);
const append = promisify(client.append).bind(client);
const expire = promisify(client.expire).bind(client);

module.exports = {
  client,
  set,
  get,
  del,
  append,
  expire,
};
