const ical = require('ical-generator');
const path = require('path');
const Calendar = require('../model/calendar_model')
require('dotenv').config()

const iCalendarFeed = async (req, res, next) => {
    try {
        let { tripId, tripName, iCalEvents } = req.body;
    
        const calendar = ical({name: tripName});
        for (let event of iCalEvents) {
            event.location = await Calendar.getSpotAddress(event.googleId);
            delete event.googleId
            calendar.createEvent(event);
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