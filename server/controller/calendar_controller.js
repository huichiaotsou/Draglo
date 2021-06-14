const ical = require('ical-generator');
const tz = require('@touch4it/ical-timezones');

const path = require('path');
const Calendar = require('../model/calendar_model')
require('dotenv').config()

const iCalendarFeed = async (req, res, next) => {
    try {
        let { tripId, tripName, iCalEvents } = req.body;
        const vtimezone = tz.getVtimezone('Asia/Taipei');

        const calendar = ical({
            name: tripName,
            timezone: vtimezone,
            });
        
        for (let event of iCalEvents) {
            event.location = await Calendar.getSpotAddress(event.googleId);
            delete event.googleId
            calendar.createEvent(event);
            console.log('iCalEvent: ');
            console.log(event);
        }  
        let calendarId = await Calendar.generateCalendar(tripId);
        await calendar.save(path.join(__dirname + '../../../public/calendars/' + `./${calendarId}.ical`))
        res.status(200).send(process.env.ROOT_ROUTE + '/calendars' + `/${calendarId}.ical`)
    } catch (error) {
        next (error)
    }
}

module.exports = {
    iCalendarFeed
}