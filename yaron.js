
{
  spotName: 'my home',
  geolocation: FOTMATGEO(lat, lng),
  ...
}

spots.map( spot => {
  [
    spot.spotName, spot.geolocation
  ]
})