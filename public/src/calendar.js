import { Calendar } from '@fullcalendar/core';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import './calendar.css';

window.addEventListener('storage', function() {
  const tripSettingsString = localStorage.getItem('trip_settings');
  const tripSettings = JSON.parse(tripSettingsString);
  const tripId = tripSettings.id;
  const start = tripSettings.trip_start
  const end = tripSettings.trip_end
  const duration = tripSettings.duration; 

  // initialize the calendar
  // -----------------------------------------------------------------
  const calendarEl = document.getElementById('calendar');
  const calendar = new Calendar(calendarEl, {
    timeZone: 'local',
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
      let publicId = info.event.id
      let { title } = info.event
      let jsEvent = info.jsEvent;
      if (isEventOut(jsEvent.clientX, jsEvent.clientY)) {
        calendar.getEventById(publicId).remove()
        let eventContainer = document.getElementById('external-events');
        let eventBack = document.createElement('div');
        eventBack.className = 'fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event';
        eventBack.setAttribute('id', publicId)
        eventBack.setAttribute('ondblclick', `removeEvent('${publicId}')`)
        eventContainer.appendChild(eventBack);
        let eventDetails = document.createElement('div');
        eventDetails.className = 'fc-event-main';
        eventDetails.innerHTML = title;
        eventDetails.dataset.place_id = publicId;
        eventBack.appendChild(eventDetails);
        //change is_arranged back to 0
        let { spotId } = info.event.extendedProps
        updateArrangement(0, spotId, tripId, 'null', 'null'); 
      }
    },
    // drop: function(info) {
    //   console.log(info.draggedEl);
    //   // info.draggedEl.parentNode.removeChild(info.draggedEl);
    // },
    eventReceive: function(info) {
      //change is_arranged = 1 and record period
      let { spotId } = info.event.extendedProps
      let { start, end } = info.event
      updateArrangement(1, spotId, tripId, start, end); 

    },
    eventDrop: function(info) {
      //change arrangement period
      let { spotId } = info.event.extendedProps
      let { start, end } = info.event
      updateArrangement(1, spotId, tripId, start, end); 

    },
    eventResize : function(info) {
      //change arrangement period
      let { spotId } = info.event.extendedProps
      let { start, end } = info.event
      updateArrangement(1, spotId, tripId, start, end); 
      
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
        position: 'top-start',
        icon: 'warning',
        title: '自動安排行程目前僅限於城市內',
        text: '請先在城市清單中選擇一個城市',
      }) 
    } else {
      let cityName = calculateTripBtn.dataset.city
      calculateTrip(cityName);
      let timerInterval
      Swal.fire({
        title: '行程計算中!',
        html: '請耐心等候',
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
        /* Read more about handling dismissals below */
        if (result.dismiss === Swal.DismissReason.timer) {
          getPendingArrangements(null, JSON.parse(localStorage.getItem('trip_settings')).id);
          getArrangements(calendar, tripId);
          calendar.render();
        }
      })
    }
  })

  calendar.render();    
});


  function isEventOut (x, y) {
    let calendar = document.getElementById('calendar-container');
    if (x >= calendar.offsetWidth - 20 || y < 100)  { 
      return true; 
    }
    return false;
  }


  function getArrangements (calendar, tripId) {
    //get all arrangements and push in calendar
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `/arrangement?status=arranged&id=${tripId}`);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
        let arrangements = JSON.parse(xhr.responseText);
        arrangements.map( a => {
          // let timezoneOffset = (new Date(a.start_time).getTimezoneOffset()) / 60; 
          // let start = new Date(a.start_time)
          // let end = new Date(a.end_time)
          calendar.addEvent({
            id: a.google_id,
            title: a.name,
            start: a.start_time,
            end: a.end_time,
            // start: new Date(start.setHours(start.getHours() - timezoneOffset)),
            // end: new Date(end.setHours(end.getHours() - timezoneOffset)),
            extendedProps: {
              spotId: a.spot_id
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