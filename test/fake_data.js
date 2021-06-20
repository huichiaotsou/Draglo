const users = [
  {
    provider: 'native',
    email: 'test1@test.com',
    password: 'test1password',
  },
  {
    provider: 'Google',
    email: 'test2@test.com',
    password: null,
  },
  {
    provider: 'native',
    email: 'test3@test.com',
    password: 'test3password',
  },
];

const trips = [
  {
    name: 'trip1',
    trip_start: new Date('2022-01-01'),
    trip_end: new Date('2022-01-06'),
    day_start: '0900',
    day_end: '2000',
    is_archived: 0,
    user_id: 1,
    image: '/images/bg.jpg',
    calendar_id: '775bc5c3120',
  },
  {
    name: 'trip2',
    trip_start: new Date('2022-01-01'),
    trip_end: new Date('2022-01-06'),
    day_start: '0900',
    day_end: '2000',
    is_archived: 0,
    user_id: 3,
    image: '/images/bg.jpg',
    calendar_id: '775bc5c3120',
  },
  {
    name: 'trip3',
    trip_start: new Date('2022-01-01'),
    trip_end: new Date('2022-01-06'),
    day_start: '0900',
    day_end: '2000',
    is_archived: 0,
    user_id: 3,
    image: '/images/bg.jpg',
    calendar_id: '775bc5c3120',
  },
  {
    name: 'trip4',
    trip_start: new Date('2022-01-01'),
    trip_end: new Date('2022-01-06'),
    day_start: '0900',
    day_end: '2000',
    is_archived: 1,
    user_id: 1,
    image: '/images/bg.jpg',
    calendar_id: '775bc5c3120',
  },
  {
    name: 'trip5',
    trip_start: new Date('2022-01-01'),
    trip_end: new Date('2022-01-06'),
    day_start: '0900',
    day_end: '2000',
    is_archived: 0,
    user_id: 3,
    image: '/images/bg.jpg',
    calendar_id: '775bc5c3120',
  },
];

const sharedTrips = [
  {
    trip_id: 2,
    user_id: 1,
    share_token: 'share_token_1',
    token_used: 1,
  },
  {
    trip_id: 3,
    user_id: 1,
    share_token: 'share_token_2',
    token_used: 0,
  },
];

module.exports = {
  users,
  trips,
  sharedTrips,
};
