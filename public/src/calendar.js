import { Calendar } from '@fullcalendar/core';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import './calendar.css';

window.addEventListener('storage', function() {
  const tripSettingsString = localStorage.getItem('trip_settings');
  const tripSettings = JSON.parse(tripSettingsString);
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
      start: start ,
      end: end
    }, 
    nowIndicator: true,
    editable: true,
    eventResizableFromStart: true,
    droppable: true,
    slotMinTime: "00:00:00",
    slotMaxTime: "24:00:00",
    scrollTime: "09:00:00",
    drop: function(info) {
      info.draggedEl.parentNode.removeChild(info.draggedEl);
    },
    eventDragStop: function( event ) {
      let {publicId, title} = event.event._def
      let jsEvent = event.jsEvent;
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
      }
    },
    headerToolbar: {
        start: '', // buttons for switching between views
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

let isEventOut = function(x, y) {
  let calendar = document.getElementById('calendar-container');
  if (x >= calendar.offsetWidth - 20 || y < 100)  { 
    return true; 
  }
  return false;
}

  // initialize events
  // -----------------------------------------------------------------
  const containerEl = document.getElementById('external-events');
  new Draggable(containerEl, {
    itemSelector: '.fc-event',
    eventData: function (event) {
      return {
        id: event.id,
        title: event.innerText,
        duration: '02:00'
      }; //create event blocks with duration 2 hours
    }
  });

  let saveTripName = document.getElementById('save-trip-name')
  saveTripName.addEventListener('click', ()=>{
    let arr = calendar.getEvents();
    console.log("title: "+ arr[0]._def.title);
    console.log("id: "+ arr[0]._def.publicId);
    console.log("start: " + new Date(arr[0]._instance.range.start).toUTCString());
    console.log("end: " + new Date(arr[0]._instance.range.end).toUTCString());
  })

    calendar.render();
  });


