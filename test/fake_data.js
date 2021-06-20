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

const spots = [
  {
    google_id: 'spot_google_id_1',
    city: 'Taipei City',
    name: 'spot_name_1',
    latitude: 24.9960345,
    longtitude: 121.5762835,
    linger_time: 90,
    address: 'spot_address_1',
    open_days: '0,1,2,3,4,5,6',
    open_hour: '0900',
    closed_hour: '1800',
  },
  {
    google_id: 'spot_google_id_2',
    city: 'Taipei City',
    name: 'spot_name_2',
    latitude: 24.972981,
    longtitude: 121.5883709,
    linger_time: 90,
    address: 'spot_address_2',
    open_days: '0,1,2,3,4,5,6',
    open_hour: '0900',
    closed_hour: '1800',
  },
  {
    google_id: 'spot_google_id_3',
    city: 'Taipei City',
    name: 'spot_name_2',
    latitude: 24.9983469,
    longtitude: 121.5810358,
    linger_time: 90,
    address: 'spot_address_3',
    open_days: '0,1,2,3,4,5,6',
    open_hour: '0900',
    closed_hour: '1800',
  },
];

module.exports = {
  users,
  trips,
  sharedTrips,
  spots,
};
