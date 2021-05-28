function switchAutomationCity(cityName) {
    let calculateTripBtn = document.getElementById('calculateTrip');
    calculateTripBtn.dataset.city = cityName;
}

function calculateTrip (cityName, startDate, dayStart) {
    let data = {}
    data.googleIds = []
    data.spotsInfo = {}
    let spots = document.getElementsByClassName(cityName);
    for(let i = 0; i < spots.length; i++){
        let dataset = spots[i].dataset
        data.googleIds.push(dataset.place_id);
        data.spotsInfo[`${dataset.place_id}`] = {
            vector: [parseFloat(dataset.latitude), parseFloat(dataset.longtitude)],
            name: spots[i].innerHTML,
            spotId: spots[i].parentNode.dataset.spotId
        }
    }
    data.tripDuration = Math.round(((spots.length * 90) + ((spots.length - 1) * 30))/60/9);
    let tripSettings = JSON.parse(localStorage.getItem('trip_settings'));
    data.tripId = tripSettings.id;
    // let tripStart = startDate || tripSettings.trip_start;
    data.startDate = startDate
    data.dayId = new Date(startDate).getDay();
    data.startTime = dayStart || 540;
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/automation')
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let otherEvents = JSON.parse(xhr.responseText);
            localStorage.removeItem('night_events');
            localStorage.removeItem('remaining_spots');
            localStorage.setItem('night_events', JSON.stringify(otherEvents.nightEvents))
            localStorage.setItem('remaining_spots', JSON.stringify(otherEvents.remainingSpots))
        }
    }
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));

}
