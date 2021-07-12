/* eslint-disable */
import { Calendar } from '@fullcalendar/core';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import './calendar.css';

let calendar;
window.addEventListener('storage', function() {
  
  const tripSettings = JSON.parse(localStorage.getItem('trip_settings'));
  const tripId = tripSettings.id;
  const start = tripSettings.trip_start
  const end = tripSettings.trip_end
  const duration = tripSettings.duration; 

  let socket = io({
    auth: {
        token: localStorage.getItem('access_token')
    }
  });
  
  // initialize the calendar
  // -----------------------------------------------------------------
  const calendarEl = document.getElementById('calendar');
  calendar = new Calendar(calendarEl, {
    timeZone: 'UTC',
    plugins: [timeGridPlugin, interactionPlugin],
    initialView: 'weekView',
    validRange: {
      start: start,
      end: end
    }, 
    nowIndicator: true,
    editable: true,
    droppable: true,
    slotLabelInterval: "01:00",
    slotDuration:"00:30:00",
    slotMinTime: "00:00:00",
    slotMaxTime: "24:00:00",
    scrollTime: "08:00:00",
    eventDragStop: function(info) {
      let jsEvent = info.jsEvent;
      if (isEventOut(jsEvent.clientX, jsEvent.clientY)) {
        let event = info.event
        let publicId = event.id
        let { title } = event
        let { spotId } = event.extendedProps
        //change is_arranged back to 0
        updateArrangement(0, spotId, tripId, 'null', 'null', 0); 
        calendar.getEventById(publicId).remove()
        let eventContainer = document.getElementById('external-events');
        let eventBack = document.createElement('div');
        eventBack.className = 'fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event';
        eventBack.setAttribute('id', publicId)
        eventBack.setAttribute('ondblclick', `removeEvent('${spotId}', '${tripId}')`)
        eventContainer.appendChild(eventBack);
        let eventDetails = document.createElement('div');
        eventDetails.className = 'fc-event-main';
        eventDetails.innerHTML = title;
        eventDetails.dataset.place_id = publicId;
        eventDetails.dataset.openHour = event.extendedProps.openHour;
        eventDetails.dataset.closedHour = event.extendedProps.closedHour;
        eventDetails.dataset.city = event.extendedProps.city;
        eventBack.appendChild(eventDetails);
        socket.emit('removeArrangement', publicId)
        setTimeout(() => {
          socket.emit('refreshSpots');
        }, 500);
      }
    },
    drop: function(info) {
      if (info.draggedEl.parentNode) {
        info.draggedEl.parentNode.removeChild(info.draggedEl);
      }
    },
    eventReceive: function(info) {
      //change is_arranged = 1 and record period
      let { spotId } = info.event.extendedProps
      let { start, end } = info.event
      updateArrangement(1, spotId, tripId, start, end, 0); 
      let event = info.event
      let elementChild = info.draggedEl.lastElementChild
      let eventInfo = {
        id: event.id,
        title: event.title,
        start: start,
        end: end,
        color: '#3788d8',
        extendedProps: {
          tripId: tripId,
          spotId: event.extendedProps.spotId,
          latitude: elementChild.dataset.latitude,
          longtitude: elementChild.dataset.longtitude,
          openHour: elementChild.dataset.openHour,
          closedHour: elementChild.dataset.closedHour,
          city: elementChild.dataset.city
        }
      }
      socket.emit('updateArrangement', eventInfo)
      setTimeout(() => {
        socket.emit('refreshSpots');
      }, 500);
    },
    eventDrop: function(info) {
      //change arrangement period
      let { spotId } = info.event.extendedProps
      let { start, end } = info.event
      updateArrangement(1, spotId, tripId, start, end, 0);
      setTimeout(() => {
        socket.emit('refreshSpots');
      }, 500);
      let event = info.event
      let eventInfo = {
        id: event.id,
        title: event.title,
        start: start,
        end: end,
        color: '#3788d8',
        extendedProps: {
          tripId: tripId,
          spotId: event.extendedProps.spotId,
          latitude: event.extendedProps.latitude,
          longtitude: event.extendedProps.longtitude,
          openHour: event.extendedProps.openHour,
          closedHour: event.extendedProps.closedHour,
          city: event.extendedProps.city
        }
      }
      socket.emit('updateArrangement', eventInfo)
    },
    eventResize : function(info) {
      //change arrangement period
      let { spotId } = info.event.extendedProps
      let { start, end } = info.event
      updateArrangement(1, spotId, tripId, start, end, 0); 
      let event = info.event
      let eventInfo = {
        id: event.id,
        title: event.title,
        start: start,
        end: end,
        color: '#3788d8',
        extendedProps: {
          tripId: tripId,
          spotId: event.extendedProps.spotId,
          latitude: event.extendedProps.latitude,
          longtitude: event.extendedProps.longtitude,
          openHour: event.extendedProps.openHour,
          closedHour: event.extendedProps.closedHour,
          city: event.extendedProps.city
        }
      }
      socket.emit('updateArrangement', eventInfo)
    },
    eventClick : function(info) {
      let date = info.event.start
      let path = getPolylinePath(date);
      renderDayPath(path);
    },
    headerToolbar: {
        start: '',
        center: '', 
        end: ''
    },
    footerToolbar: {
      start: 'dayView threeDaysView weekView tripView',
      center: '', 
      end: 'prev,next'
    },
    views: {
        tripView: {
          type: 'timeGrid',
          duration: { days: duration },
          buttonText: 'Show Full Trip',
          allDaySlot: false,
          slotEventOverlap: true
        }, 
        dayView: {
          type: 'timeGrid',
          duration: { days: 1 },
          buttonText: 'Day View',
          allDaySlot: false,
          slotEventOverlap: true
        },
        threeDaysView: {
          type: 'timeGrid',
          duration: { days: 3 },
          buttonText: '3 Days View',
          allDaySlot: false,
          slotEventOverlap: true
        },
        weekView: {
          type: 'timeGrid',
          duration: { days: 7 },
          buttonText: '7 Days View',
          allDaySlot: false,
          slotEventOverlap: true
        },
    }
  }); 

  // initialize events
  // -----------------------------------------------------------------
  const containerEl = document.getElementById('external-events');
  new Draggable(containerEl, {
    itemSelector: '.fc-event',
    eventData: function (event) {
      return {
        id: event.id,
        title: event.innerText,
        duration: '01:30',
        extendedProps: {
          spotId: event.dataset.spotId
        }
      }; //create event blocks with duration 2 hours
    }
  });

  getArrangements(calendar, tripId); //-> render events -> render calendar

  let calculateTripBtn = document.getElementById('calculateTrip');
  calculateTripBtn.addEventListener('click', ()=>{
    if (calculateTripBtn.dataset.city == 'null') {
      let cityList = document.getElementsByClassName('city')
      let html = `
      <div class="btn-group btn-group-toggle" data-toggle="buttons">
      `
      for (let city of cityList) {
        html += `
        <label class="btn btn-sm btn-outline-primary" onclick="switchAutomationCity('${city.innerHTML.split(' ')[0]}');">
          <input type="radio" 
          name="options" 
          autocomplete="off" 
          style="margin-right: 10px;">${city.innerHTML}
        </label>`
      }
      html += `</div>`
  
      Swal.fire({
        position: 'top-end',
        title: 'Pick a city to get <br>the optimized schedule',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'I have chosen',
        html: html
      }).then((result) => {
        if (result.isConfirmed) {
          if (calculateTripBtn.dataset.city == 'null') {
            Swal.fire({
              position: 'top-end',
              title: 'Pick a city',
              text: "Please pick a city for automatic calculation",
              icon: 'warning',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'OK'
            })
          } else {
            calulateBtnClicked();
          }
        } else {
          switchAutomationCity('null')
        }
      })
    } else {
      calulateBtnClicked();
    }

  })

  function calulateBtnClicked() {
    let cityName = calculateTripBtn.dataset.city;
    let dayStart = calculateTripBtn.dataset.dayStart;
    let allEvents = calendar.getEvents();
    let startDate = new Date(new Date(start).setHours(0,0,0,0));
    let arrangedEvents = {}; //dayId: 開始, 結束, google id, lat lng
    let previousCityVector = []
    if (allEvents.length > 0) { //if 安排中的城市和最後一個不同，則從隔日開始, else 從起始日
      allEvents.sort(function (a,b) {
        return new Date(a.start) - new Date(b.start);
      });
      //確認新的 startDate
      let lastEvent = allEvents[allEvents.length - 1];
      previousCityVector = [lastEvent.extendedProps.latitude, lastEvent.extendedProps.longtitude] 
      let end = new Date(lastEvent.end)
      end.setUTCHours(0,0,0,0)
      startDate = new Date (end.setUTCDate(end.getUTCDate() +1))
      startDate.setHours(0,0,0,0)
      let lastSpotCity = lastEvent.extendedProps.city
      if (lastSpotCity == cityName) {
        startDate = new Date(new Date(start).setHours(0,0,0,0));
      }

      // arranged events send to backend
      allEvents.map(e => {
        let eventDate = new Date(e.start).setUTCHours(0,0,0,0)
        let eStart = new Date(e.start)
        let eEnd = new Date(e.end);

        if (arrangedEvents[eventDate]) {
          arrangedEvents[eventDate].push(
            {
              start: (eStart.getUTCHours() * 60) + eStart.getUTCMinutes(),
              end: (eEnd.getUTCHours() * 60) + eEnd.getUTCMinutes(),
              google_id: e.id,
              latitude: e.extendedProps.latitude,
              longtitude: e.extendedProps.longtitude
            }
          )
        } else {
          arrangedEvents[eventDate] = [
            {
              start: (e.start.getUTCHours() * 60) + e.start.getUTCMinutes(),
              end: (e.end.getUTCHours() * 60) + e.end.getUTCMinutes(),
              google_id: e.id,
              latitude: e.extendedProps.latitude,
              longtitude: e.extendedProps.longtitude
            }
          ]
        }

      })
    }
    startDate = startDate.toString()
    Swal.fire({
      position: 'top-end',
      title: '目前行程計算的設定為：',
      html: `
      <div style="color:#007bff; font-size: 20px;">
        城市：${cityName}
      </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: `OK`
    }).then((result) => {
      if (result.isConfirmed) {
        calculateTrip(cityName, startDate, dayStart, previousCityVector, arrangedEvents);
      }
    })
  }

  let icalBtn = document.getElementById('iCal-feed');
  icalBtn.addEventListener('click', ()=>{
    let allEvents = calendar.getEvents()
    let data = {
      tripId: tripId,
      tripName: tripSettings.name,
      iCalEvents: []
    }
    
    for (let event of allEvents) {
      data.iCalEvents.push(
        {
          summary: event.title,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          description: "開放時間: " + event.extendedProps.openHour +" ~ "+ event.extendedProps.closedHour,
          googleId: event.id
        }
      )
    }
    createiCalFeed(data, 'create')
  })

  function getPolylinePath(date){ 
    let allEvents = calendar.getEvents();
    allEvents.sort(function (a,b) {
      return new Date(b.start) - new Date(a.start);
    });
    
    let path = {
      center: {
        lat: 0, lng: 0
      },
      coordinates: [],
      spots: []
    }
    allEvents.map(event => {
      if (checkSameDay(new Date(date), new Date(event.start))) {
        path.coordinates.push(
          {
            lat: parseFloat(event.extendedProps.latitude), 
            lng: parseFloat(event.extendedProps.longtitude)
          }
        );
        path.spots.push(
          [
            event.extendedProps.latitude,
            event.extendedProps.longtitude,
            event.title,
            `${event.extendedProps.openHour} ~ ${event.extendedProps.closedHour}`
          ]
        )
      }
    })

    let sum = path.coordinates.reduce((acc, cur) => {
      return {
        lat: acc.lat + cur.lat,
        lng: acc.lng + cur.lng
      }
    })
    path.center.lat = sum.lat/path.coordinates.length;
    path.center.lng = sum.lng/path.coordinates.length;

    return path;
  }
  calendar.render();
  
  socket.on('connect', function(){
    socket.emit('joinTrip')
  });
  
  socket.on('join-trip-message', (msg)=>{
    getPendingArrangements(null, tripId)
  })
  
  socket.on('room-brocast', (msg)=>{
    getPendingArrangements(null, tripId)
  })
  
  socket.on('refreshSpots', (tripId)=>{
    getPendingArrangements(null, tripId)
  })
  
  socket.on('updateArrangement', (eventInfo)=>{
    let event = calendar.getEventById(eventInfo.id)
    if (event) event.remove()
    let { extendedProps } = eventInfo
    calendar.addEvent({
      id: eventInfo.id,
      title: eventInfo.title,
      start: eventInfo.start,
      end: eventInfo.end,
      color: '#3788d8',
      extendedProps: {
        spotId: extendedProps.spotId,
        latitude: parseFloat(extendedProps.latitude),
        longtitude: parseFloat(extendedProps.longtitude),
        openHour: extendedProps.openHour,
        closedHour: extendedProps.closedHour,
        city: extendedProps.city
      }
    });
    calendar.render();
  
    let allEvents = calendar.getEvents()
      let data = {
        tripId: tripId,
        tripName: JSON.parse(localStorage.getItem('trip_settings')).name,
        iCalEvents: []
      }
      
      for (let event of allEvents) {
        data.iCalEvents.push(
          {
            summary: event.title,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            description: "開放時間: " + event.extendedProps.openHour +" ~ "+ event.extendedProps.closedHour,
            googleId: event.id
          }
        )
      }
      createiCalFeed(data, 'update')
    })
  
    socket.on('removeArrangement', (eventId)=>{
      let event = calendar.getEventById(eventId)
      if (event) {
        event.remove();
      }
    })
  
    socket.on('renderCalendar', (tripId)=>{
      getArrangements(calendar, tripId);
    })
});

function checkSameDay (date1, date2) {
  date1.setHours(date1.getHours() - 8)
  date2.setHours(date2.getHours() - 8)
  if (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  ) {
    return true;
  }
}

function isEventOut (x, y) {
  let calendar = document.getElementById('calendar-container');
  if (x >= calendar.offsetWidth - 20 || y < 100)  { 
    return true; 
  }
  return false;
}

function getArrangements (calendar, tripId) {
  //clear calendar
  let allEvents = calendar.getEvents();
  if (allEvents.length > 0){
    allEvents.map(e => {
      e.remove()
    })
  }
  //get all arrangements and push in calendar
  let xhr = new XMLHttpRequest();
  xhr.open('GET', `/1.0/arrangement?status=arranged&id=${tripId}`);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      let arrangements = JSON.parse(xhr.responseText);
      arrangements.map( a => {
        let event = {
          id: a.google_id,
          title: a.name,
          start: a.start_time,
          end: a.end_time,
          extendedProps: {
            spotId: a.spot_id,
            latitude: parseFloat(a.latitude),
            longtitude: parseFloat(a.longtitude),
            openHour: a.open_hour,
            closedHour: a.closed_hour,
            city: a.city
          }
        }
        if (a.auto_arranged == 1) {
          event.color = '#2d4b91'
        }
        calendar.addEvent(event);
      })
      calendar.render();
    }
  }
  xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
  xhr.send();
}

function updateArrangement (isArranged, spotId, tripId, startTime, endTime, autoArranged) {
  let data = { 
    isArranged, 
    spotId, 
    tripId, 
    startTime, 
    endTime,
    autoArranged
  };
  let xhr = new XMLHttpRequest();
  let requestRoute = `/1.0/arrangement/${tripId}/${spotId}`
  xhr.open('PATCH', requestRoute);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status == 204) {
      } else if (xhr.status == 403){
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: '您的權限不足',
        })
      }
    }
  };
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
  xhr.send(JSON.stringify(data));
}