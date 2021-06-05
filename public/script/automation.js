function switchAutomationCity(cityName) {
    let calculateTripBtn = document.getElementById('calculateTrip');
    calculateTripBtn.dataset.city = cityName;
}

function calculateTrip (cityName, startDate, dayStart, previousCityVector) {
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

    let checkDistance = getGeoDistance( [parseFloat(spots[0].dataset.latitude),parseFloat(spots[0].dataset.longtitude)] , previousCityVector);
    let html = '系統正根據景點開放時間、景點間之交通，為您計算行程';
    if (checkDistance > 60) {
        html = `<div>系統正根據景點開放時間、景點間之交通，為您計算行程</div>
        <div style="font-size: 14px;">安排中的城市似乎距離上個城市有點距離，請記得預留足夠的交通時間 </div>`
    } 
    
    if (checkDistance > 300) {
        html = `<div>系統正根據景點開放時間、景點間之交通，為您計算行程</div>
        <div style="font-size: 14px;"> 安排中的城市似乎距離上個城市十分遙遠，可能需要坐飛機或火車唷 </div>`
    }
    let timerInterval
    Swal.fire({
        title: '行程計算中，請耐心等候',
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
    xhr.open('POST', '/automation')
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let otherEvents = JSON.parse(xhr.responseText);
            localStorage.removeItem('night_events');
            localStorage.removeItem('remaining_spots');
            localStorage.setItem('night_events', JSON.stringify(otherEvents.nightEvents))
            localStorage.setItem('remaining_spots', JSON.stringify(otherEvents.remainingSpots))
            Swal.fire({
                icon: 'success',
                title: '計算完成',
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
    let responseContent = '<h5>由於營業時間、營業日等眾多因素</h5><h5>以下景點尚未列入安排：</h5>';
    if (nightEvents.length > 0) {
        responseContent = responseContent + '<strong> 夜晚行程 </strong><div class="dropdown-divider"></div>'
        nightEvents.map(event => {
            let openDays = []
            event.openDays.split(',').map( day => {
              if(day == 0) openDays.push(' 週日 ');
              if(day == 1) openDays.push(' 週一 ');
              if(day == 2) openDays.push(' 週二 ');
              if(day == 3) openDays.push(' 週三 ');
              if(day == 4) openDays.push(' 週四 ');
              if(day == 5) openDays.push(' 週五 ');
              if(day == 6) openDays.push(' 週六 ');
            })
            let openHour = Math.floor(event.openHour/60);
            let closedHour = Math.floor(event.closedHour/60);
            if (closedHour > 24) closedHour = closedHour - 24;
            responseContent += `
            <div> 行程名稱：${event.activity} </div>
            <div> 營業時間：${openHour}點 ~ ${closedHour}點 </div>
            <div> 營業日：</div>
            <div> ${openDays.toString()} </div>
            <div class="dropdown-divider"></div>
            `  
        })
    }
    if (remainingSpots.length > 0) {
      responseContent = responseContent + `<br><strong> 其他未安排行程 </strong><div class="dropdown-divider"></div>`
      remainingSpots.map(event => {
          let openDays = []
          event.openDays.split(',').map( day => {
              if(day == 0) openDays.push(' 週日 ');
              if(day == 1) openDays.push(' 週一 ');
              if(day == 2) openDays.push(' 週二 ');
              if(day == 3) openDays.push(' 週三 ');
              if(day == 4) openDays.push(' 週四 ');
              if(day == 5) openDays.push(' 週五 ');
              if(day == 6) openDays.push(' 週六 ');
          })
          responseContent += `
            <div> 行程名稱：${event.activity} </div>
            <div> 營業時間：${Math.floor(event.openHour/60)}點 ~ ${Math.floor(event.closedHour/60)}點 </div>
            <div> 營業日：</div>
            <div> ${openDays.toString()} </div>
            <div class="dropdown-divider"></div>
            `
      })
    }
    if(nightEvents.length > 0 || remainingSpots.length > 0) {
      Swal.fire({
          position: 'top',
          title: '<strong>尚有未安排景點</strong>',
          icon: 'info',
          html: responseContent
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
    console.log('socket sent : refreshSpots and renderCalendar ');
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