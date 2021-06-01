import { Calendar } from '@fullcalendar/core';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import './calendar.css';

let accessToken = document.cookie.split('=')[1];
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get('id');

let socket = io({
  auth: {
      token: accessToken
  }
});

socket.on('connect', function(){
  console.log('join trip');
  socket.emit('joinTrip', tripId)
});

let calendar;
window.addEventListener('storage', function() {
  const tripSettingsString = localStorage.getItem('trip_settings');
  const tripSettings = JSON.parse(tripSettingsString);
  const start = tripSettings.trip_start
  const end = tripSettings.trip_end
  const duration = tripSettings.duration; 

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
    slotMinTime: "00:00:00",
    slotMaxTime: "24:00:00",
    scrollTime: "07:30:00",
    eventDragStop: function(info) {
      let jsEvent = info.jsEvent;
      if (isEventOut(jsEvent.clientX, jsEvent.clientY)) {
        let event = info.event
        let publicId = event.id
        let { title } = event
        let { spotId } = event.extendedProps
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
        eventBack.appendChild(eventDetails);
        //change is_arranged back to 0
        updateArrangement(0, spotId, tripId, 'null', 'null'); 
        socket.emit('refreshSpots', tripId);
        socket.emit('removeArrangement', publicId)
      }
    },
    // drop: function(info) {
    //   console.log(info.draggedEl);
    //   // info.draggedEl.parentNode.removeChild(info.draggedEl);
    // },
    eventReceive: function(info) {
      console.log('eventReceive triggered');
      //change is_arranged = 1 and record period
      let { spotId } = info.event.extendedProps
      let { start, end } = info.event
      updateArrangement(1, spotId, tripId, start, end); 
      socket.emit('refreshSpots', tripId);
      let event = info.event
      let elementChild = info.draggedEl.lastElementChild
      let eventInfo = {
        id: event.id,
        title: event.title,
        start: start,
        end: end,
        extendedProps: {
          tripId: tripId,
          spotId: event.extendedProps.spotId,
          latitude: elementChild.dataset.latitude,
          longtitude: elementChild.dataset.longtitude,
        }
      }
      socket.emit('updateArrangement', eventInfo)
    },
    eventDrop: function(info) {
      console.log('eventDrop triggered');
      //change arrangement period
      let { spotId } = info.event.extendedProps
      let { start, end } = info.event
      updateArrangement(1, spotId, tripId, start, end);
      socket.emit('refreshSpots', tripId);
      let event = info.event
      let eventInfo = {
        id: event.id,
        title: event.title,
        start: start,
        end: end,
        extendedProps: {
          tripId: tripId,
          spotId: event.extendedProps.spotId,
          latitude: event.extendedProps.latitude,
          longtitude: event.extendedProps.longtitude,
        }
      }
      socket.emit('updateArrangement', eventInfo)

    },
    eventResize : function(info) {
      console.log('eventResize triggered');
      //change arrangement period
      let { spotId } = info.event.extendedProps
      let { start, end } = info.event
      updateArrangement(1, spotId, tripId, start, end); 
      let event = info.event
      let eventInfo = {
        id: event.id,
        title: event.title,
        start: start,
        end: end,
        extendedProps: {
          tripId: tripId,
          spotId: event.extendedProps.spotId,
          latitude: event.extendedProps.latitude,
          longtitude: event.extendedProps.longtitude,
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
      Swal.fire({
        position: 'top-end',
        icon: 'warning',
        title: '請選擇城市',
        text: '請在城市清單中選擇您想要進行自動安排的城市',
      }) 
    } else {
      let cityName = calculateTripBtn.dataset.city;
      let dayStart = calculateTripBtn.dataset.dayStart;
      let allEvents = calendar.getEvents();
      let startDate = new Date(new Date(start).setHours(0,0,0,0));
      if (allEvents.length > 0) {
        allEvents.map(e => {
          let end = new Date(e.end)
          if (end > startDate) {
            end.setHours(0,0,0,0)
            startDate = new Date (end.setDate(end.getDate() +1))
            // startDate = new Date(new Date(end.setDate(end.getDate() + 1)).setHours(0,0,0,0))
            console.log('Tuning startDate:');
            console.log(startDate);
          }
        })
      }
      startDate = startDate.toString()
      console.log('final start Date:');
      console.log(startDate);
      Swal.fire({
        position: 'top-end',
        title: '目前自動安排的設定為：',
        html: `
        <div style="color:#007bff; font-size: 20px;">
          城市：${cityName}
        </div>
        <div style="color:#007bff; margin-top:10px"> 
          出門時間：${dayStart / 60}點 
        </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        confirmButtonText: `OK`
      }).then((result) => {
        if (result.isConfirmed) {
            calculateTrip(cityName, startDate, dayStart);
            let timerInterval
            Swal.fire({
              title: '行程計算中，請耐心等候',
              html: '系統正在根據景點開放時間、景點間之交通，為您計算行程',
              timer: 12000,
              timerProgressBar: true,
              allowOutsideClick: () => !Swal.isLoading(),
              didOpen: () => {
                Swal.showLoading()
              },
              willClose: () => {
                clearInterval(timerInterval)
              }
            }).then((result) => {
              if (result.dismiss === Swal.DismissReason.timer) {
                let nightEvents = JSON.parse(localStorage.getItem('night_events'))
                console.log(nightEvents);
                let remainingSpots = JSON.parse(localStorage.getItem('remaining_spots'))
                console.log(remainingSpots);
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
                console.log('length');
                console.log(nightEvents.length);
                console.log(remainingSpots.length);
                if(nightEvents.length > 0 || remainingSpots.length > 0) {
                  Swal.fire({
                      position: 'top',
                      title: '<strong>尚有未安排景點</strong>',
                      icon: 'info',
                      html: responseContent
                  })
                  localStorage.removeItem('night_events');
                  localStorage.removeItem('remaining_spots');    
                }
                getPendingArrangements(null, tripId);
                console.log("6");
                calculateTripBtn.dataset.city = 'null';
                getArrangements(calendar, tripId);
                calendar.render();
              }
            })
        }
      })

    }
  })

  function getPolylinePath(date){ 
    let allEvents = calendar.getEvents();
    console.log('getPolylinePath allEvents:');
    console.log(allEvents);
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
            event.title
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
    console.log(sum);
    path.center.lat = sum.lat/path.coordinates.length;
    path.center.lng = sum.lng/path.coordinates.length;

    return path;
  }
  calendar.render();    
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
    xhr.open('GET', `/arrangement?status=arranged&id=${tripId}`);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
        let arrangements = JSON.parse(xhr.responseText);
        arrangements.map( a => {
          calendar.addEvent({
            id: a.google_id,
            title: a.name,
            start: a.start_time,
            end: a.end_time,
            extendedProps: {
              spotId: a.spot_id,
              latitude: parseFloat(a.latitude),
              longtitude: parseFloat(a.longtitude)
            }
          });
        })
        calendar.render();
      }
    }
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send();
  }

  function updateArrangement (isArranged, spotId, tripId, startTime, endTime) {
    let data = { 
      isArranged, 
      spotId, 
      tripId, 
      startTime, 
      endTime
    };
    let xhr = new XMLHttpRequest();
    xhr.open('PATCH', '/arrangement');
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          console.log('update OK');
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
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send(JSON.stringify(data));

  }

socket.on('join-trip-message', (msg)=>{
  console.log(msg);
  getPendingArrangements(null, tripId)
})

socket.on('room-brocast', (msg)=>{
  console.log(msg);
  getPendingArrangements(null, tripId)
})

socket.on('refreshPendingArrangements', (tripId)=>{
    console.log('refresh pending arrangements');
    getPendingArrangements(null, tripId)
})

socket.on('updateArrangement', (eventInfo)=>{
    let event = calendar.getEventById(eventInfo.id)
    if (event) {
      event.remove()
    }
    console.log('event is removed');
    let { extendedProps } = eventInfo
    calendar.addEvent({
      id: eventInfo.id,
      title: eventInfo.title,
      start: eventInfo.start,
      end: eventInfo.end,
      extendedProps: {
        spotId: extendedProps.spotId,
        latitude: parseFloat(extendedProps.latitude),
        longtitude: parseFloat(extendedProps.longtitude)
      }
    });
    calendar.render();
    // alert(`user ${eventInfo.user} has updated ${eventInfo.title}: stat: ${eventInfo.start}`)
    console.log('event is re added');
  })

  socket.on('removeArrangement', (eventId)=>{
    let event = calendar.getEventById(eventId)
    if (event) {
      event.remove();
    }
  })