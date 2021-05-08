import { Calendar } from '@fullcalendar/core';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import './calendar.css';

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
      }; //create event blocks with duration 2 hours
    }
  });

// initialize the calendar
// -----------------------------------------------------------------
  const calendarEl = document.getElementById('calendar');
  const calendar = new Calendar(calendarEl, {
    plugins: [timeGridPlugin, interactionPlugin],
    initialView: 'tripView',
    initialDate: '2021-05-08',
    nowIndicator: true,
    editable: true,
    eventResizableFromStart: true,
    droppable: true,
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
        duration: { days: 10 },
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

  calendar.setOption('height', '100%');
  calendar.render();
});