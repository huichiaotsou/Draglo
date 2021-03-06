/* eslint-disable no-await-in-loop */
const ical = require('ical-generator');
const timezone = require('@touch4it/ical-timezones');

const path = require('path');
const Calendar = require('../model/calendar_model');
require('dotenv').config();

const iCalendarFeed = async (req, res, next) => {
  try {
    const { tripId, tripName, iCalEvents } = req.body;
    const calendar = ical({
      name: tripName,
      generator: timezone,
    });

    for (const event of iCalEvents) {
      event.location = await Calendar.getSpotAddress(event.googleId);
      delete event.googleId;
      event.timezone = 'Asia/Taipei';
      calendar.createEvent(event);
    }

    const calendarId = await Calendar.generateCalendar(tripId);
    await calendar.save(path.join(__dirname, '../../public/calendars/', `./${calendarId}.ical`));
    res.status(200).send(`${process.env.ROOT_ROUTE}/calendars/${calendarId}.ical`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  iCalendarFeed,
};
