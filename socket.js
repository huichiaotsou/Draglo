const { Server } = require("socket.io");
const socket = {};

socket.init = (server) => {
    const io = new Server(server);
    console.log('socket init with success');

    io.on('connection', (socket) => {
        console.log('io.on connected');

        // const token = socket.handshake.auth.token;
        // if (token === undefined) {
        // return;
        // }
        const url = socket.request.headers.referer;
        console.log("user connected at", url);

        socket.on('refreshSpots', (tripId)=>{
            console.log(tripId + "refreshSpots --> tripId received on backend");
            socket.broadcast.emit('refreshPendingArrangements', tripId)
        })

        socket.on('updateArrangement', (eventInfo)=>{
            console.log("updateArrangement --> eventInfo received on backend");
            socket.broadcast.emit('updateArrangement', eventInfo)
        })

    })
}

module.exports = {
    socket
}