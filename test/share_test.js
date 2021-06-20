/* eslint-disable no-undef */
require('dotenv').config();
const { assert, requester } = require('./set_up');
const { users } = require('./fake_data');

describe('share_controller', () => {
  let accessToken1;

  before(async () => {
    const res1 = await requester
      .post('/1.0/signin')
      .send(users[0]);
    accessToken1 = res1.body.data.access_token;
  });

  it('create share token: user has access (trip_id: 1, user_id: 1)', async () => {
    const res = await requester
      .post('/1.0/share')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send({ tripId: 1 });
    assert.isString(res.text);
    assert.equal(res.status, 200);
  });

  it('create share token: user has shared access (trip_id: 2, user_id: 1)', async () => {
    const res = await requester
      .post('/1.0/share')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send({ tripId: 2 });
    assert.isString(res.text);
    assert.equal(res.status, 200);
  });

  it('create share token: user has no access (trip_id: 5, user_id: 1)', async () => {
    const res = await requester
      .post('/1.0/share')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send({ tripId: 5 });
    assert.equal(res.status, 403);
  });
});
