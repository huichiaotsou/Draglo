/* eslint-disable no-undef */
require('dotenv').config();
const { assert, requester } = require('./set_up');
const { pool } = require('../server/model/mysql');
const { users } = require('./fake_data');

describe('trip_controller', () => {
  let accessToken1;
  let accessToken3;

  before(async () => {
    const res1 = await requester
      .post('/1.0/signin')
      .send(users[0]);
    accessToken1 = res1.body.data.access_token;

    const res2 = await requester
      .post('/1.0/signin')
      .send(users[2]);
    accessToken3 = res2.body.data.access_token;
  });

  it('get trip settings: user has access (user_id = 1, trip_id = 1)', async () => {
    const res = await requester
      .get('/1.0/trip?id=1')
      .set('Authorization', `Bearer ${accessToken1}`);
    const resTrip = res.body;
    const expectedTrip = {
      id: 1,
      name: 'trip1',
      image: '/images/bg.jpg',
      trip_start: '2022-01-01T00:00:00.000Z',
      trip_end: '2022-01-06T00:00:00.000Z',
      day_start: '0900',
      day_end: '2000',
      is_archived: 0,
      user_id: 1,
      calendar_id: '775bc5c3120',
      otherTrips: [{ id: 1, name: 'trip1' }],
      duration: 5, // duration is 5 cuz trip_end ad midnight of Jan 6 (end of Jan 5)
    };
    assert.deepEqual(resTrip, expectedTrip);
  });

  it('get trip settings: user has access to multiple trips (user_id = 2, trip_id = 2)', async () => {
    const res = await requester
      .get('/1.0/trip?id=2')
      .set('Authorization', `Bearer ${accessToken3}`);
    const expectedTrip = {
      id: 2,
      name: 'trip2',
      image: '/images/bg.jpg',
      trip_start: '2022-01-01T00:00:00.000Z',
      trip_end: '2022-01-06T00:00:00.000Z',
      day_start: '0900',
      day_end: '2000',
      is_archived: 0,
      user_id: 3,
      otherTrips: [
        { id: 2, name: 'trip2' },
        { id: 3, name: 'trip3' },
        { id: 5, name: 'trip5' },
      ],
      duration: 5,
    };
    delete res.body.calendar_id;
    assert.deepEqual(res.body, expectedTrip);
  });

  it('get trip settings: user has no access (user_id = 1, trip_id = 5)', async () => {
    const res = await requester
      .get('/1.0/trip?id=5')
      .set('Authorization', `Bearer ${accessToken1}`);
    assert.equal(res.status, 403);
  });

  it('modify trip_id 1: duration', async () => {
    const newStart = new Date();
    const newEnd = new Date();
    newEnd.setDate(newEnd.getDate() + 7);
    const res = await requester
      .patch('/1.0/trip/1')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send({
        modify: 'duration',
        tripStart: newStart,
        tripEnd: newEnd,
      });

    const resTrip = await requester
      .get('/1.0/trip?id=1')
      .set('Authorization', `Bearer ${accessToken1}`);
    const dbNewStart = new Date(resTrip.body.trip_start).getTime();
    const dbNewEnd = new Date(resTrip.body.trip_end).getTime();

    assert.equal(res.status, 204);
    assert.closeTo(newStart.getTime(), dbNewStart, 1000);
    assert.closeTo(newEnd.getTime(), dbNewEnd, 1000);
  });

  it('modify trip_id 1: duration more than 20 days', async () => {
    const newStart = new Date();
    const newEnd = new Date();
    newEnd.setDate(newEnd.getDate() + 21);
    const res = await requester
      .patch('/1.0/trip/1')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send({
        modify: 'duration',
        tripStart: newStart,
        tripEnd: newEnd,
      });
    assert.equal(res.status, 403);
    assert.equal(res.text, 'too long period');
  });

  it('modify trip_id 1: trip end is earlier than trip start', async () => {
    const newStart = new Date();
    const newEnd = new Date();
    newEnd.setDate(newEnd.getDate() - 1);
    const res = await requester
      .patch('/1.0/trip/1')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send({
        modify: 'duration',
        tripStart: newStart,
        tripEnd: newEnd,
      });
    assert.equal(res.status, 403);
    assert.equal(res.text, 'trip end is earlier than trip start');
    await pool.query('UPDATE trips SET trip_start = 2022-01-01, trip_end = 2022-01-06 WHERE id = 1');
  });

  it('modify trip_id 1: name', async () => {
    const tripName = 'new name';
    const res = await requester
      .patch('/1.0/trip/1')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send({
        modify: 'name',
        tripName,
      });

    const resTrip = await requester
      .get('/1.0/trip?id=1')
      .set('Authorization', `Bearer ${accessToken1}`);

    assert.equal(res.status, 204);
    assert.equal(resTrip.body.name, tripName);
    await pool.query('UPDATE trips SET name = "trip1" WHERE id = 1');
  });

  it('modify trip_id 1: archived', async () => {
    const archived = 1;
    const res = await requester
      .patch('/1.0/trip/1')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send({
        modify: 'archived',
        archived,
      });
    const resTrip = await requester
      .get('/1.0/trip?id=1')
      .set('Authorization', `Bearer ${accessToken1}`);

    assert.equal(res.status, 204);
    assert.equal(resTrip.body.is_archived, archived);
    await pool.query('UPDATE trips SET is_archived = 0 WHERE id = 1');
  });

  it('modify trip_id 1: user has no access', async () => {
    const archived = 1;
    const res = await requester
      .patch('/1.0/trip/1')
      .send({
        modify: 'archived',
        archived,
      });
    assert.equal(res.status, 401);
  });

  it('create trip', async () => {
    const [[initTripCount]] = await pool.query('SELECT COUNT(*) AS count FROM trips');
    await requester
      .post('/1.0/trip')
      .set('Authorization', `Bearer ${accessToken1}`);
    const [[finaltripCount]] = await pool.query('SELECT COUNT(*) AS count FROM trips');
    assert.equal(finaltripCount.count, initTripCount.count + 1);
  });

  it('create trip without log in', async () => {
    const [[initTripCount]] = await pool.query('SELECT COUNT(*) AS count FROM trips');
    const res = await requester
      .post('/1.0/trip');
    const [[finaltripCount]] = await pool.query('SELECT COUNT(*) AS count FROM trips');
    assert.equal(finaltripCount.count, initTripCount.count);
    assert.equal(res.status, 401);
  });
});
