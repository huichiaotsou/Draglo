import { Calendar } from '@fullcalendar/core';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import './calendar.css';

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

document.addEventListener('DOMContentLoaded', function() {

// initialize events
// -----------------------------------------------------------------
  const containerEl = document.getElementById('external-events');
  new Draggable(containerEl, {
    itemSelector: '.fc-event',
    eventData: function (eventEl) {
      return {
        title: eventEl.innerText,
        duration: '03:00'
      }; //create event blocks with duration 3 hours
    }
  });

// initialize the calendar
// -----------------------------------------------------------------
  const calendarEl = document.getElementById('calendar');
  const calendar = new Calendar(calendarEl, {
    plugins: [timeGridPlugin, interactionPlugin],
    initialView: 'tripView',
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
    drop: function(info) {
        info.draggedEl.parentNode.removeChild(info.draggedEl);
      
    },
    headerToolbar: {
        start: '', // buttons for switching between views
        center: '', 
        end: ''
    },
    footerToolbar: {
      start: 'weekView',
      center: 'tripView', 
      end: 'prev,next'
    },
    views: {
        tripView: {
        type: 'timeGrid',
        duration: { days: duration },
        buttonText: 'Show Full Trip',
        allDaySlot: false,
        slotEventOverlap: true
      }, weekView: {
        type: 'timeGrid',
        duration: { days: 7 },
        buttonText: '7 Days View',
        allDaySlot: false,
        slotEventOverlap: true
      },
    }
  });  

  // calendar.setOption('height', '90vh');
  calendar.render();
});


// function openPeriodSetting() {
//   let form = document.querySelector('#setPeriod');
//   form.style.display = block;
// }