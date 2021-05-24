function switchAutomationCity(cityName) {
    let calculateTripBtn = document.getElementById('calculateTrip');
    console.log(calculateTripBtn);
    calculateTripBtn.dataset.city = cityName;
}

function calculateTrip (cityName) {
    let data = {}
    data.googleIds = []
    data.spotsInfo = {}
    let spots = document.getElementsByClassName(cityName);
    console.log(spots);
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
    let tripStart = tripSettings.trip_start;
    data.tripId = tripSettings.id;
    data.startDate = new Date(tripStart)
    data.dayId = new Date(tripStart).getDay();
    data.startTime = 540;
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/automation')
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // let response = JSON.parse(xhr.responseText);
            // console.log(response);
            
        }
    }
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    console.log(data);
    xhr.send(JSON.stringify(data));

}