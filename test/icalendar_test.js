/* eslint-disable no-undef */
require('dotenv').config();
const { assert, requester } = require('./set_up');
const { users } = require('./fake_data');

const iCalEvents = [
  {
    summary: '艾菲爾鐵塔',
    start: '2021-08-08T11:00:00.000Z',
    end: '2021-08-08T12:30:00.000Z',
    description: '開放時間: 0:0 ~ 24:0',
    googleId: 'spot_google_id_1',
  },
  {
    summary: '巴黎凱旋門',
    start: '2021-08-09T11:00:00.000Z',
    end: '2021-08-09T12:30:00.000Z',
    description: '開放時間: 10:0 ~ 22:0',
    googleId: 'spot_google_id_2',
  },
  {
    summary: '巴黎大皇宮',
    start: '2021-08-08T13:30:00.000Z',
    end: '2021-08-08T15:00:00.000Z',
    description: '開放時間: 0:0 ~ 24:0',
    googleId: 'spot_google_id_3',
  },
];

describe('ical_controller', () => {
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

  it('update ical feed: user has access (trip_id: 2, user_id: 3)', async () => {
    const reqBody = {
      tripId: 2,
      tripName: 'trip2',
      iCalEvents,
    };
    const res = await requester
      .post('/1.0/calendar')
      .set('Authorization', `Bearer ${accessToken3}`)
      .send(reqBody);
    assert.equal(res.status, 200);
    assert.equal(res.text, 'https://draglo.com/calendars/da4b92372.ical');
  });

  it('update ical feed: user has no access (trip_id: 5, user_id: 1)', async () => {
    const reqBody = {
      tripId: 5,
      tripName: 'trip5',
      iCalEvents,
    };
    const res = await requester
      .post('/1.0/calendar')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send(reqBody);

    assert.equal(res.status, 403);
  });
});
