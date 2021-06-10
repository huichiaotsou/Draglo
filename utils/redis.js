const { promisify } = require('util');

const redis = require('redis');
const client = redis.createClient({
    host : 'localhost',
    port : 6379
});

client.on('ready', () => {
    console.log('redis is ready');
})

client.on('error', () => {
    console.log('redis error');
})

let set = promisify(client.set).bind(client);
let get = promisify(client.get).bind(client);
let del = promisify(client.del).bind(client);
let append = promisify(client.append).bind(client);
let expire = promisify(client.expire).bind(client);

module.exports = {
    client,
    set,
    get,
    del,
    append,
    expire
}