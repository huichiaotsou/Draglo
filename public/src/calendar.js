import { Calendar } from '@fullcalendar/core';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import './calendar.css';

document.addEventListener('DOMContentLoaded', function() {
  
  //get calendar setting from URL
  const urlParams = new URLSearchParams(window.location.search);
  // const start = new Date(urlParams.get('start')),
  // const end = new Date(urlParams.get('end'))
  // const duration = 1 + (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
  const start = new Date('2021-07-20');
  const end = new Date('2021-07-28');
  const duration = 9;
  
  const daystart = urlParams.get('daystart');
  const dayend = urlParams.get('datend');
  
  // initialize the calendar
  // -----------------------------------------------------------------
  const calendarEl = document.getElementById('calendar');
  const calendar = new Calendar(calendarEl, {
    timeZone: 'UTC',
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
    slotMinTime: daystart || "00:00:00",
    slotMaxTime: dayend || "24:00:00",
    scrollTime: "09:00:00",
    drop: function(info) {
      info.draggedEl.parentNode.removeChild(info.draggedEl);
    },
    eventDragStop: function( event ) {
      let {publicId, title} = event.event._def
      let jsEvent = event.jsEvent;
      calendar.getEventById(publicId).remove()
      if (isEventOut(jsEvent.clientX, jsEvent.clientY)) {
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
    eventData: function (eventEl) {
      return {
        id: eventEl.id,
        title: eventEl.innerText,
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


