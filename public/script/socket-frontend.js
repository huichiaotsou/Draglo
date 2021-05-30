const socket = io({
    auth: {
        token: accessToken
    }
});

socket.on('refreshPendingArrangements', (tripId)=>{
    console.log('refresh pending arrangements');
    getPendingArrangements(null, tripId)
})
