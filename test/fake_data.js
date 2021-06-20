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
];

const trips = [
  {
    name: 'Paris with mom',
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
    name: 'London with bao',
    trip_start: new Date('2022-01-01'),
    trip_end: new Date('2022-01-06'),
    day_start: '0900',
    day_end: '2000',
    is_archived: 0,
    user_id: 2,
    image: '/images/bg.jpg',
    calendar_id: '775bc5c3120',
  },
  {
    name: 'Bangkok with bao',
    trip_start: new Date('2022-01-01'),
    trip_end: new Date('2022-01-06'),
    day_start: '0900',
    day_end: '2000',
    is_archived: 0,
    user_id: 2,
    image: '/images/bg.jpg',
    calendar_id: '775bc5c3120',
  },
];

module.exports = {
  users,
  trips,
};
