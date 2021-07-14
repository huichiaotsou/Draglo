/* eslint-disable */

function switchAutomationCity(cityName) {
    let calculateTripBtn = document.getElementById('calculateTrip');
    calculateTripBtn.dataset.city = cityName;
}

function calculateTrip (cityName, startDate, dayStart, previousCityVector, arrangedEvents) {
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
    data.arrangedEvents = arrangedEvents

    let checkDistance = getGeoDistance( [parseFloat(spots[0].dataset.latitude),parseFloat(spots[0].dataset.longtitude)] , previousCityVector);
    let html = 'The app is calculating an optimized trip <br> according to the opening days & hours of the spots as well as the transit time';
    if (checkDistance > 60) {
        html = `<div>The app is calculating an optimized trip <br> according to the opening days & hours of the spots as well as the transit time</div>
        <div style="font-size: 14px; margin-top:10px; font-weight: 700;">The city you are arranging is far from the previous one. <br> Don't forget to leave enough travel time</div>`
    } 
    
    if (checkDistance > 300) {
        html = `<div>The app is calculating an optimized trip <br> according to the opening days & hours of the spots as well as the transit time</div>
        <div style="font-size: 14px; margin-top:10px; font-weight: 700;">The city you are arranging is very far from the previous one. <br> You might need to take a train or a flight.</div>`
    }
    let timerInterval
    Swal.fire({
        title: 'The optimized schedule is being calculated',
        html: html,
        timer: 20000,
        timerProgressBar: true,
        allowOutsideClick: () => !Swal.isLoading(),
        didOpen: () => {
            Swal.showLoading()
        },
        willClose: () => {
            clearInterval(timerInterval)
        }
    })
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/1.0/automation')
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let otherEvents = JSON.parse(xhr.responseText);
            localStorage.removeItem('night_events');
            localStorage.removeItem('remaining_spots');
            localStorage.setItem('night_events', JSON.stringify(otherEvents.nightEvents))
            localStorage.setItem('remaining_spots', JSON.stringify(otherEvents.remainingSpots))
            Swal.fire({
                icon: 'success',
                title: 'Calculation is done!',
                confirmButtonColor: '#3085d6'
              })
            renderUnarrangedResult();
        }
    }
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
}

function renderUnarrangedResult(){
    let nightEvents = JSON.parse(localStorage.getItem('night_events'))
    let remainingSpots = JSON.parse(localStorage.getItem('remaining_spots'))
    let responseContent = '<h5>Because of special opening hours</h5><h5>the following spots are not arranged:</h5>';
    if (nightEvents.length > 0) {
        responseContent = responseContent + '<strong> Night events </strong><div class="dropdown-divider"></div>'
        nightEvents.map(event => {
            let openDays = []
            event.openDays.split(',').map( day => {
              if(day == 0) openDays.push(' Sunday ');
              if(day == 1) openDays.push(' Monday ');
              if(day == 2) openDays.push(' Tuesady ');
              if(day == 3) openDays.push(' Wednesday ');
              if(day == 4) openDays.push(' Thursday ');
              if(day == 5) openDays.push(' Friday ');
              if(day == 6) openDays.push(' Saturday ');
            })
            if(openDays.length === 7) {
              openDays = ['Weekdays and Weekend']
            }
            let openHour = Math.floor(event.openHour/60);
            let closedHour = Math.floor(event.closedHour/60);
            if (closedHour > 24) closedHour = closedHour - 24;
            responseContent += `
            <div> Spot：${event.activity} </div>
            <div> Opening hours：${openHour}:00 ~ ${closedHour}:00 </div>
            <div> Opens on：</div>
            <div> ${openDays.toString()} </div>
            <div class="dropdown-divider"></div>
            `  
        })
    }
    if (remainingSpots.length > 0) {
      responseContent = responseContent + `<br><strong> Other remaining spots </strong><div class="dropdown-divider"></div>`
      remainingSpots.map(event => {
        let openDays = []
        event.openDays.split(',').map( day => {
            if(day == 0) openDays.push(' Sunday ');
            if(day == 1) openDays.push(' Monday ');
            if(day == 2) openDays.push(' Tuesady ');
            if(day == 3) openDays.push(' Wednesday ');
            if(day == 4) openDays.push(' Thursday ');
            if(day == 5) openDays.push(' Friday ');
            if(day == 6) openDays.push(' Saturday ');
        })
        if(openDays.length === 7) {
          openDays = ['Weekdays and Weekend']
        }
        responseContent += `
        <div> Spot：${event.activity} </div>
        <div> Opening hours：${Math.floor(event.openHour/60)}:00 ~ ${Math.floor(event.closedHour/60)}:00 </div>
        <div> Opens on：</div>
        <div> ${openDays.toString()} </div>
        <div class="dropdown-divider"></div>
        `
      })
    }
    if(nightEvents.length > 0 || remainingSpots.length > 0) {
      Swal.fire({
          position: 'top',
          title: '<strong>Remaining Spots</strong>',
          icon: 'info',
          html: responseContent,
          confirmButtonColor: '#3085d6'
      })
    }
    localStorage.removeItem('night_events');
    localStorage.removeItem('remaining_spots');
    let calculateTripBtn = document.getElementById('calculateTrip');
    calculateTripBtn.dataset.city = 'null';
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('id');
    let socket = io({
        auth: {
            token: accessToken
        }
    });
    socket.emit('refreshSpots', tripId)
    socket.emit('renderCalendar', tripId)
}

//https://www.itread01.com/content/1541853492.html
function getRad(d){
    var PI = Math.PI;
    return d*PI/180.0;
}

function getGeoDistance([lat1,lng1],[lat2,lng2]){
    var f = getRad((lat1 + lat2)/2);
    var g = getRad((lat1 - lat2)/2);
    var l = getRad((lng1 - lng2)/2);
    var sg = Math.sin(g);
    var sl = Math.sin(l);
    var sf = Math.sin(f);
    var s,c,w,r,d,h1,h2;
    var a = 6378137.0;//The Radius of eath in meter.
    var fl = 1/298.257;
    sg = sg*sg;
    sl = sl*sl;
    sf = sf*sf;
    s = sg*(1-sl) + (1-sf)*sl;
    c = (1-sg)*(1-sl) + sf*sl;
    w = Math.atan(Math.sqrt(s/c));
    r = Math.sqrt(s*c)/w;
    d = 2*w*a;
    h1 = (3*r -1)/2/c;
    h2 = (3*r +1)/2/s;
    s = d*(1 + fl*(h1*sf*(1-sg) - h2*(1-sf)*sg));
    if(isNaN(s)){
        s = 0;
    }else if (s >= 0 ){
        s = Math.round(s);
    }
    return s / 1000; //單位= km
}