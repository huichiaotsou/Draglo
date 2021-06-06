
// function start() {
//   // 2. Initialize the JavaScript client library.
//   gapi.client.init({
//     'apiKey': 'AIzaSyC7JZBoemp8yVauFZ_9J2cShM2J7uJqCjQ',
//     'clientId': '83631735915-g6vaaeunnvhaabqgbso5bpj6barl9o9i.apps.googleusercontent.com',
//     'scope': 'https://www.googleapis.com/auth/calendar',
//   }).then(function() {
//     // 3. Initialize and make the API request.
//     return gapi.client.request({
//       'path': 'https://people.googleapis.com/v1/people/me?requestMask.includeField=person.names',
//     })
//   }).then(function(response) {
//     console.log(response.result);
//   }, function(reason) {
//     console.log('Error: ' + reason.result.error.message);
//   });
// };
// // 1. Load the JavaScript client library.
// gapi.load('client', start);
