/* eslint-disable no-undef */
require('dotenv').config();
const { assert, requester } = require('./set_up');
// const { pool } = require('../server/model/mysql');
const { users } = require('./fake_data');

describe('arrangement controller', async () => {
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

  it('get pending arrangements', async () => {
    const res = await requester
      .get('/1.0/arrangement?id=1&status=pending')
      .set('Authorization', `Bearer ${accessToken1}`);
    const expectedArrangements = {
      cities: ['Taipei City', 'Taitung'],
      spots: [
        {
          name: 'spot_name_3',
          city: 'Taipei City',
          google_id: 'spot_google_id_3',
          spot_id: 3,
          latitude: 24.9983469,
          longtitude: 121.5810358,
          open_hour: '9:00',
          closed_hour: '18:00',
        },
        {
          name: 'spot_name_4',
          city: 'Taitung',
          google_id: 'spot_google_id_4',
          spot_id: 4,
          latitude: 24.9993469,
          longtitude: 121.5820358,
          open_hour: '18:00',
          closed_hour: '23:00',
        },
      ],
    };
    assert.deepEqual(res.body, expectedArrangements);
  });

  it('get pending arrangements: city is specified (Taipei City / Taitung)', async () => {
    const res = await requester
      .get('/1.0/arrangement?id=1&status=pending&city=Taitung')
      .set('Authorization', `Bearer ${accessToken1}`);
    const expectedArrangements = {
      cities: ['Taitung'],
      spots: [
        {
          name: 'spot_name_4',
          city: 'Taitung',
          google_id: 'spot_google_id_4',
          spot_id: 4,
          latitude: 24.9993469,
          longtitude: 121.5820358,
          open_hour: '18:00',
          closed_hour: '23:00',
        },
      ],
    };
    assert.deepEqual(res.body, expectedArrangements);

    const res2 = await requester
      .get('/1.0/arrangement?id=1&status=pending&city=Taipei City')
      .set('Authorization', `Bearer ${accessToken1}`);
    const expectedArrangements2 = {
      cities: ['Taipei City'],
      spots: [
        {
          name: 'spot_name_3',
          city: 'Taipei City',
          google_id: 'spot_google_id_3',
          spot_id: 3,
          latitude: 24.9983469,
          longtitude: 121.5810358,
          open_hour: '9:00',
          closed_hour: '18:00',
        },
      ],
    };
    assert.deepEqual(res2.body, expectedArrangements2);
  });

  it('get pending arrangements: city not in the list', async () => {
    const res = await requester
      .get('/1.0/arrangement?id=1&status=pending&city=Chabucha')
      .set('Authorization', `Bearer ${accessToken1}`);
    const expectedArrangements = { cities: '', spots: [] };
    assert.deepEqual(res.body, expectedArrangements);
    assert.equal(res.status, 200);
  });

  it('get pending arrangements: unarranged google_id is specified', async () => {
    const res = await requester
      .get('/1.0/arrangement?id=1&status=pending&placeId=spot_google_id_3')
      .set('Authorization', `Bearer ${accessToken1}`);
    const expectedArrangements = {
      cities: ['Taipei City'],
      spots: [
        {
          name: 'spot_name_3',
          city: 'Taipei City',
          google_id: 'spot_google_id_3',
          spot_id: 3,
          latitude: 24.9983469,
          longtitude: 121.5810358,
          open_hour: '9:00',
          closed_hour: '18:00',
        },
      ],
    };
    assert.deepEqual(res.body, expectedArrangements);
  });

  it('get pending arrangements: arranged google_id is specified', async () => {
    const res = await requester
      .get('/1.0/arrangement?id=1&status=pending&placeId=spot_google_id_1')
      .set('Authorization', `Bearer ${accessToken1}`);
    assert.isBoolean(res.body.isArranged);
  });

  it('get pending arrangements: google_id not in the list', async () => {
    const res = await requester
      .get('/1.0/arrangement?id=1&status=pending&placeId=spot_google_id_5')
      .set('Authorization', `Bearer ${accessToken1}`);
    assert.deepEqual(res.body, { cities: '', spots: [] });
  });

  it('get pending arrangements: google_id does not exist', async () => {
    const res = await requester
      .get('/1.0/arrangement?id=1&status=pending&placeId=spot_google_id_99')
      .set('Authorization', `Bearer ${accessToken1}`);
    assert.deepEqual(res.body, { cities: '', spots: [] });
  });

  it('get pending arrangements: user has shared access', async () => {
    const res = await requester
      .get('/1.0/arrangement?id=2&status=pending')
      .set('Authorization', `Bearer ${accessToken1}`);
    const expectedArrangements = {
      cities: ['Taipei City'],
      spots: [
        {
          name: 'spot_name_2',
          city: 'Taipei City',
          google_id: 'spot_google_id_2',
          spot_id: 2,
          latitude: 24.972981,
          longtitude: 121.5883709,
          open_hour: '9:00',
          closed_hour: '18:00',
        },
      ],
    };
    assert.deepEqual(res.body, expectedArrangements);
  });

  it('get pending arrangements: user has no access', async () => {
    const res = await requester
      .get('/1.0/arrangement?id=1&status=pending')
      .set('Authorization', `Bearer ${accessToken3}`);
    assert.equal(res.status, 403);
  });

  it('get arrangements', async () => {
    const res = await requester
      .get('/1.0/arrangement?id=1&status=arranged')
      .set('Authorization', `Bearer ${accessToken1}`);
    const expectedArrangements = [
      {
        name: 'spot_name_1',
        city: 'Taipei City',
        google_id: 'spot_google_id_1',
        spot_id: 1,
        start_time: '2022-01-01T01:00:00.000Z',
        end_time: '2022-01-01T02:30:00.000Z',
        latitude: 24.9960345,
        longtitude: 121.5762835,
        open_hour: '9:00',
        closed_hour: '18:00',
        auto_arranged: null,
      },
      {
        name: 'spot_name_2',
        city: 'Taipei City',
        google_id: 'spot_google_id_2',
        spot_id: 2,
        start_time: '2022-01-01T03:00:00.000Z',
        end_time: '2022-01-01T04:30:00.000Z',
        latitude: 24.972981,
        longtitude: 121.5883709,
        open_hour: '9:00',
        closed_hour: '18:00',
        auto_arranged: null,
      },
    ];
    assert.deepEqual(res.body, expectedArrangements);
  });

  it('get arrangements: user has shared access', async () => {
    const res = await requester
      .get('/1.0/arrangement?id=2&status=arranged')
      .set('Authorization', `Bearer ${accessToken1}`);
    const expectedArrangements = [
      {
        name: 'spot_name_1',
        city: 'Taipei City',
        google_id: 'spot_google_id_1',
        spot_id: 1,
        start_time: '2022-01-01T01:00:00.000Z',
        end_time: '2022-01-01T02:30:00.000Z',
        latitude: 24.9960345,
        longtitude: 121.5762835,
        open_hour: '9:00',
        closed_hour: '18:00',
        auto_arranged: null,
      },
    ];
    assert.deepEqual(res.body, expectedArrangements);
  });

  it('get arrangements: user has no access', async () => {
    const res = await requester
      .get('/1.0/arrangement?id=1&status=arranged')
      .set('Authorization', `Bearer ${accessToken3}`);
    assert.equal(res.status, 403);
  });

  it('modify arrangement: unarranged -> arranged', async () => {
    const reqBody = {
      isArranged: 1,
      startTime: '2022-01-01 13:00:00',
      endTime: '2022-01-01 13:30:00',
      autoArranged: 0,
    };
    const res = await requester
      .patch('/1.0/arrangement/1/3')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send(reqBody);
    assert.equal(res.status, 204);
  });

  it('modify arrangement: arranged -> arranged', async () => {
    const reqBody = {
      isArranged: 1,
      startTime: '2022-01-01 09:30:00',
      endTime: '2022-01-01 10:00:00',
      autoArranged: 0,
    };
    const res = await requester
      .patch('/1.0/arrangement/1/1')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send(reqBody);
    assert.equal(res.status, 204);
  });

  it('modify arrangement: spot not in the arrangement list', async () => {
    const reqBody = {
      isArranged: 1,
      startTime: '2022-01-01 09:30:00',
      endTime: '2022-01-01 10:00:00',
      autoArranged: 0,
    };
    const res = await requester
      .patch('/1.0/arrangement/1/99')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send(reqBody);
    assert.equal(res.status, 403);
  });

  it('modify arrangement: clear all arrangements', async () => {
    const res = await requester
      .patch('/1.0/arrangement/1/cleartrip')
      .set('Authorization', `Bearer ${accessToken1}`);
    assert.equal(res.status, 204);
  });

  it('modify arrangement: user has shared access', async () => {
    const res = await requester
      .patch('/1.0/arrangement/2/cleartrip')
      .set('Authorization', `Bearer ${accessToken1}`);
    assert.equal(res.status, 204);
  });

  it('modify arrangement: user has no access', async () => {
    const res = await requester
      .patch('/1.0/arrangement/1/cleartrip')
      .set('Authorization', `Bearer ${accessToken3}`);
    assert.equal(res.status, 403);
  });

  it('delete arrangement(spot list)', async () => {
    const res = await requester
      .delete('/1.0/arrangement/1/1')
      .set('Authorization', `Bearer ${accessToken1}`);
    assert.equal(res.status, 204);
  });

  it('delete arrangement(spot list): spot not in the list', async () => {
    const res = await requester
      .delete('/1.0/arrangement/1/99')
      .set('Authorization', `Bearer ${accessToken1}`);
    assert.equal(res.status, 403);
  });

  it('delete arrangement(spot list): duplicate deletion', async () => {
    await requester
      .delete('/1.0/arrangement/1/3')
      .set('Authorization', `Bearer ${accessToken1}`);
    const res2 = await requester
      .delete('/1.0/arrangement/1/3')
      .set('Authorization', `Bearer ${accessToken1}`);
    assert.equal(res2.status, 403);
  });

  it('delete arrangement(spot list): user has shared access', async () => {
    const res = await requester
      .delete('/1.0/arrangement/2/1')
      .set('Authorization', `Bearer ${accessToken1}`);
    assert.equal(res.status, 204);
  });

  it('delete arrangement(spot list): user has no access', async () => {
    const res = await requester
      .delete('/1.0/arrangement/1/4')
      .set('Authorization', `Bearer ${accessToken3}`);
    assert.equal(res.status, 403);
  });
});
