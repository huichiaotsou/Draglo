/* eslint-disable no-undef */
require('dotenv').config();
const nock = require('nock');
const { assert, requester } = require('./set_up');
const { users } = require('./fake_data');
const { spotMockData } = require('./google_mock_spot');

describe('spot controller', async () => {
  const taipei = '/json?fields=address_component,formatted_address,type,url,photo,geometry,opening_hours&key=AIzaSyBtGsZzNEp000nLgBRtwZwhWJZyGd4AjMY&place_id=taipei';
  const tokyo = '/json?fields=address_component,formatted_address,type,url,photo,geometry,opening_hours&key=AIzaSyBtGsZzNEp000nLgBRtwZwhWJZyGd4AjMY&place_id=tokyo';
  const taitung = '/json?fields=address_component,formatted_address,type,url,photo,geometry,opening_hours&key=AIzaSyBtGsZzNEp000nLgBRtwZwhWJZyGd4AjMY&place_id=taitung';
  const brazil = '/json?fields=address_component,formatted_address,type,url,photo,geometry,opening_hours&key=AIzaSyBtGsZzNEp000nLgBRtwZwhWJZyGd4AjMY&place_id=brazil';
  const taipeiCity = '/json?fields=address_component,formatted_address,type,url,photo,geometry,opening_hours&key=AIzaSyBtGsZzNEp000nLgBRtwZwhWJZyGd4AjMY&place_id=taipeiCity';
  let accessToken1;
  before(async () => {
    nock('https://maps.googleapis.com/maps/api/place/details')
      .get(taipei).reply(200, spotMockData.taipei);
    nock('https://maps.googleapis.com/maps/api/place/details')
      .get(tokyo).reply(200, spotMockData.tokyo);
    nock('https://maps.googleapis.com/maps/api/place/details')
      .get(taitung).reply(200, spotMockData.taitung);
    nock('https://maps.googleapis.com/maps/api/place/details')
      .get(brazil).reply(200, spotMockData.brazil);
    nock('https://maps.googleapis.com/maps/api/place/details')
      .get(taipeiCity).reply(200, spotMockData.taipeiCity);

    const res1 = await requester
      .post('/1.0/signin')
      .send(users[0]);
    accessToken1 = res1.body.data.access_token;
  });

  it('add spot (Taipei 101)', async () => {
    const reqBody = {
      tripId: 1,
      spotName: 'Taipei 101',
      placeId: 'taipei',
    };
    const res = await requester
      .post('/1.0/arrangement')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send(reqBody);
    assert.equal(res.status, 204);

    const res2 = await requester
      .get('/1.0/arrangement?id=1&status=pending&placeId=taipei')
      .set('Authorization', `Bearer ${accessToken1}`);
    const expectedSpotInfo = {
      cities: ['Taipei City'],
      spots: [
        {
          name: 'Taipei 101',
          city: 'Taipei City',
          google_id: 'taipei',
          spot_id: 6,
          latitude: 25.0338041,
          longtitude: 121.5645561,
          open_hour: '12:00',
          closed_hour: '20:00',
        },
      ],
    };
    assert.deepEqual(res2.body, expectedSpotInfo);
  });

  it('add spot (Tokyo Tower)', async () => {
    const reqBody = {
      tripId: 1,
      spotName: 'Tokyo Tower',
      placeId: 'tokyo',
    };
    const res = await requester
      .post('/1.0/arrangement')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send(reqBody);
    assert.equal(res.status, 204);

    const res2 = await requester
      .get('/1.0/arrangement?id=1&status=pending&placeId=tokyo')
      .set('Authorization', `Bearer ${accessToken1}`);
    const expectedSpotInfo = {
      cities: ['Tokyo'],
      spots: [
        {
          name: 'Tokyo Tower',
          city: 'Tokyo',
          google_id: 'tokyo',
          spot_id: 7,
          latitude: 35.6585805,
          longtitude: 139.7454329,
          open_hour: '9:00',
          closed_hour: '20:00',
        },
      ],
    };

    assert.deepEqual(res2.body, expectedSpotInfo);
  });

  it('add spot (Rio, Christ the Redeemer)', async () => {
    const reqBody = {
      tripId: 1,
      spotName: 'Christ the Redeemer',
      placeId: 'brazil',
    };
    const res = await requester
      .post('/1.0/arrangement')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send(reqBody);
    assert.equal(res.status, 204);

    const res2 = await requester
      .get('/1.0/arrangement?id=1&status=pending&placeId=brazil')
      .set('Authorization', `Bearer ${accessToken1}`);
    const expectedSpotInfo = {
      cities: ['RJ'],
      spots: [
        {
          name: 'Christ the Redeemer',
          city: 'RJ',
          google_id: 'brazil',
          spot_id: 8,
          latitude: -22.951916,
          longtitude: -43.2104872,
          open_hour: '8:00',
          closed_hour: '19:00',
        },
      ],
    };
    assert.deepEqual(res2.body, expectedSpotInfo);
  });

  it('add spot: add city as spot', async () => {
    const reqBody = {
      tripId: 1,
      spotName: 'Taipei City',
      placeId: 'taipeiCity',
    };
    const res = await requester
      .post('/1.0/arrangement')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send(reqBody);
    const expectedResponse = { error: '請選擇特定景點以加入清單' };

    assert.equal(res.status, 400);
    assert.deepEqual(JSON.parse(res.text), expectedResponse);
  });

  it('add spot: without login', async () => {
    const reqBody = {
      tripId: 1,
      spotName: 'Taitung Train Station',
      placeId: 'taitung',
    };
    const res = await requester
      .post('/1.0/arrangement')
      .send(reqBody);

    assert.equal(res.status, 401);
  });
});
