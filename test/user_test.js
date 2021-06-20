// /* eslint-disable consistent-return */
// /* eslint-disable no-else-return */
// /* eslint-disable no-undef */
// require('dotenv').config();
// const sinon = require('sinon');
// const google = require('../utils/google');
// const { assert, requester } = require('./set_up');
// const { pool } = require('../server/model/mysql');
// const { users } = require('./fake_data');

// let stub;
// describe('user_controller', () => {
//   let accessToken1;
//   let accessToken3;
//   before(async () => {
//     // prepare access tokens
//     const res1 = await requester
//       .post('/1.0/signin')
//       .send(users[0]);
//     accessToken1 = res1.body.data.access_token;

//     const res2 = await requester
//       .post('/1.0/signin')
//       .send(users[2]);
//     accessToken3 = res2.body.data.access_token;

//     // stub: google oauth
//     const fakeGetGmailAddress = (googleToken) => {
//       if (!googleToken) {
//         return Promise.resolve();
//       } else if (googleToken === 'valid_google_token') {
//         return Promise.resolve({ gmail: 'google-sign-in-first-time@gmail.com' });
//       } else if (googleToken === 'invalide_google_token') {
//         return Promise.resolve({ error: 'invalid token' });
//       }
//     };
//     stub = sinon.stub(google, 'getGmailAddress').callsFake(fakeGetGmailAddress);
//     // console.log(stub);
//   });

//   it('get dashboard', async () => {
//     const res = await requester
//       .get('/1.0/dashboard')
//       .set('Authorization', `Bearer ${accessToken3}`);
//     const expectedTrips = {
//       data: [
//         {
//           trip_id: 2,
//           name: 'trip2',
//           image: '/images/bg.jpg',
//           trip_start: '2022-01-01T00:00:00.000Z',
//           trip_end: '2022-01-06T00:00:00.000Z',
//         },
//         {
//           trip_id: 3,
//           name: 'trip3',
//           image: '/images/bg.jpg',
//           trip_start: '2022-01-01T00:00:00.000Z',
//           trip_end: '2022-01-06T00:00:00.000Z',
//         },
//         {
//           trip_id: 5,
//           name: 'trip5',
//           image: '/images/bg.jpg',
//           trip_start: '2022-01-01T00:00:00.000Z',
//           trip_end: '2022-01-06T00:00:00.000Z',
//         },
//       ],
//     };
//     assert.deepEqual(res.body, expectedTrips);
//   });

//   it('get dashboard: search', async () => {
//     const res = await requester
//       .get('/1.0/dashboard?keyword=5')
//       .set('Authorization', `Bearer ${accessToken3}`);
//     const expectedTrips = {
//       data: [
//         {
//           trip_id: 5,
//           name: 'trip5',
//           image: '/images/bg.jpg',
//           trip_start: '2022-01-01T00:00:00.000Z',
//           trip_end: '2022-01-06T00:00:00.000Z',
//         },
//       ],
//     };
//     assert.deepEqual(res.body, expectedTrips);
//   });

//   it('get dashboard: search with keyword of no result', async () => {
//     const res = await requester
//       .get('/1.0/dashboard?keyword=random words')
//       .set('Authorization', `Bearer ${accessToken3}`);
//     const expectedTrips = { data: [] };
//     assert.deepEqual(res.body, expectedTrips);
//   });

//   it('get dashboard: archived', async () => {
//     const res = await requester
//       .get('/1.0/dashboard?archived=true')
//       .set('Authorization', `Bearer ${accessToken1}`);
//     const expectedTrips = {
//       data: [
//         {
//           trip_id: 4,
//           name: 'trip4',
//           image: '/images/bg.jpg',
//           trip_start: '2022-01-01T00:00:00.000Z',
//           trip_end: '2022-01-06T00:00:00.000Z',
//         },
//       ],
//     };
//     assert.deepEqual(res.body, expectedTrips);
//   });

//   it('get dashboard: shared', async () => {
//     const res = await requester
//       .get('/1.0/dashboard?shared=true')
//       .set('Authorization', `Bearer ${accessToken1}`);
//     const expectedTrips = {
//       data: [
//         {
//           trip_id: 2,
//           name: 'trip2',
//           image: '/images/bg.jpg',
//           trip_start: '2022-01-01T00:00:00.000Z',
//           trip_end: '2022-01-06T00:00:00.000Z',
//         },
//         {
//           trip_id: 3,
//           name: 'trip3',
//           image: '/images/bg.jpg',
//           trip_start: '2022-01-01T00:00:00.000Z',
//           trip_end: '2022-01-06T00:00:00.000Z',
//         },
//       ],
//     };
//     assert.deepEqual(res.body, expectedTrips);
//   });

//   it('get dashboard without log-in', async () => {
//     const res = await requester
//       .get('/1.0/dashboard?shared=true');
//     assert.equal(res.status, 401);
//   });

//   it('user sign up: correct format email and password', async () => {
//     const user = {
//       provider: 'native',
//       email: 'test4@test.com',
//       password: 'test4password',
//     };
//     const res = await requester
//       .post('/1.0/signup')
//       .send(user);
//     const resUser = res.body.data;

//     assert.deepEqual(resUser.user.email, user.email);
//     assert.isString(resUser.access_token);
//     assert.equal(resUser.access_expired, 28800);
//   });

//   it('user sign up: wrong format email', async () => {
//     const user = {
//       provider: 'native',
//       email: 'test4',
//       password: 'test4password',
//     };
//     const res = await requester
//       .post('/1.0/signup')
//       .send(user);
//     assert.equal(res.status, 400);
//   });

//   it('user sign up: without email or password', async () => {
//     const userWithoutEmail = {
//       provider: 'native',
//       password: 'test4password',
//     };
//     const res1 = await requester
//       .post('/1.0/signup')
//       .send(userWithoutEmail);

//     const userWithoutPwd = {
//       provider: 'native',
//       email: 'test4@test.com',
//     };
//     const res2 = await requester
//       .post('/1.0/signup')
//       .send(userWithoutPwd);

//     assert.equal(res1.status, 400);
//     assert.equal(res2.status, 400);
//   });

//   it('user sign up: with share token', async () => {
//     const createShareToken = await requester
//       .post('/1.0/share')
//       .set('Authorization', `Bearer ${accessToken1}`)
//       .send({ tripId: 1 });
//     const shareToken = createShareToken.text;

//     const user = {
//       provider: 'native',
//       email: 'test5@test.com',
//       password: 'test5password',
//       shareToken,
//     };
//     const res = await requester
//       .post('/1.0/signup')
//       .send(user);
//     const resUser = res.body.data;

//     assert.equal(createShareToken.status, 200);
//     assert.equal(res.body.tripId, 1);
//     assert.deepEqual(resUser.user.email, user.email);
//     assert.isString(resUser.access_token);
//     assert.equal(resUser.access_expired, 28800);
//   });

//   it('user sign up: with used share token', async () => {
//     const createShareToken = await requester
//       .post('/1.0/share')
//       .set('Authorization', `Bearer ${accessToken1}`)
//       .send({ tripId: 1 });
//     const shareToken = createShareToken.text;
//     await pool.query('UPDATE contributors SET token_used = 1 WHERE share_token = ?', shareToken);

//     const user = {
//       provider: 'native',
//       email: 'test6@test.com',
//       password: 'test6password',
//       shareToken,
//     };

//     const res = await requester
//       .post('/1.0/signup')
//       .send(user);
//     assert.equal(res.status, 403);
//     assert.equal(res.text, 'the token has already been used');
//   });

//   it('native sign in: correct credentials', async () => {
//     const user = {
//       provider: 'native',
//       email: 'test1@test.com',
//       password: 'test1password',
//     };
//     const res = await requester
//       .post('/1.0/signin')
//       .send(user);
//     const resUser = res.body.data;

//     assert.deepEqual(resUser.user.email, user.email);
//     assert.isString(resUser.access_token);
//     assert.equal(resUser.access_expired, 28800);
//   });

//   it('native sign in: non-existent email', async () => {
//     const user = {
//       provider: 'native',
//       email: 'non-existent@test.com',
//       password: 'test1password',
//     };
//     const res = await requester
//       .post('/1.0/signin')
//       .send(user);

//     assert.equal(res.status, 400);
//     assert.equal(res.text, 'Not registered, redirecting to registration page');
//   });

//   it('native sign in: wrong password', async () => {
//     const user = {
//       provider: 'native',
//       email: 'test1@test.com',
//       password: 'wrongPassword',
//     };
//     const res = await requester
//       .post('/1.0/signin')
//       .send(user);

//     assert.equal(res.status, 403);
//     assert.equal(res.text, 'Wrong password');
//   });

//   it('native sign in: malicious password', async () => {
//     const user = {
//       provider: 'native',
//       email: 'test1@test.com',
//       password: '" OR 1=1; -- ',
//     };
//     const res = await requester
//       .post('/1.0/signin')
//       .send(user);

//     assert.equal(res.status, 403);
//     assert.equal(res.text, 'Wrong password');
//   });

//   it('native sign in: with share token', async () => {
//     const createShareToken = await requester
//       .post('/1.0/share')
//       .set('Authorization', `Bearer ${accessToken1}`)
//       .send({ tripId: 1 });
//     const shareToken = createShareToken.text;

//     const user = {
//       provider: 'native',
//       email: 'test3@test.com',
//       password: 'test3password',
//       shareToken,
//     };
//     const res = await requester
//       .post('/1.0/signin')
//       .send(user);
//     const resUser = res.body.data;

//     assert.equal(createShareToken.status, 200);
//     assert.equal(res.body.tripId, 1);
//     assert.deepEqual(resUser.user.email, user.email);
//     assert.isString(resUser.access_token);
//     assert.equal(resUser.access_expired, 28800);
//   });

//   it('native sign in: with used share token', async () => {
//     const createShareToken = await requester
//       .post('/1.0/share')
//       .set('Authorization', `Bearer ${accessToken1}`)
//       .send({ tripId: 1 });
//     const shareToken = createShareToken.text;
//     await pool.query('UPDATE contributors SET token_used = 1 WHERE share_token = ?', shareToken);

//     const user = {
//       provider: 'native',
//       email: 'test3@test.com',
//       password: 'test3password',
//       shareToken,
//     };

//     const res = await requester
//       .post('/1.0/signin')
//       .send(user);
//     assert.equal(res.status, 403);
//     assert.equal(res.text, 'the token has already been used');
//   });

//   // it('Google sign in: first time', async () => {
//   //   const user = {
//   //     provider: 'Google',
//   //     googleToken: 'valid_google_token',
//   //   };

//   //   const res = await requester
//   //     .post('/1.0/signin')
//   //     .send(user);

//   //   const resUser = res.body.data;
//   //   console.log(resUser);

//   //   // assert.deepEqual(resUser.user.email, user.email);
//   //   // assert.isString(resUser.access_token);
//   //   // assert.equal(resUser.access_expired, 28800);
//   // });

//   // it('Google sign in');
//   // it('Google sign in: with share token');
//   // it('Google sign in: with used share token');

//   after(() => {
//     stub.restore();
//   });
// });
