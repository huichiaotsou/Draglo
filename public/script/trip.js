const beaches = [
  ["Bondi Beach", -33.890542, 151.274856, 4],
  ["Coogee Beach", -33.923036, 151.259052, 5],
  ["Cronulla Beach", -34.028249, 151.157507, 3],
  ["Manly Beach", -33.80010128657071, 151.28747820854187, 2],
  ["Maroubra Beach", -33.950198, 151.259302, 1],
];

main();

function main () {
  initMap(beaches)
}

function initMap(beaches) {
    const map = new google.maps.Map(document.getElementById("map"), {
      zoom: 10,
      center: { lat: -33.9, lng: 151.2 },
    });
    setMarkers(map);
  }
  
  function setMarkers(map) {
    const image = {
      url:
        "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
    };

  
    for (let i = 0; i < beaches.length; i++) {
      const beach = beaches[i];
      let marker = new google.maps.Marker({
        position: { lat: beach[1], lng: beach[2] },
        map,
        icon: image,
        title: beach[0],
        zIndex: beach[3],
      });
      let infowindow = new google.maps.InfoWindow({
        content:`<button onclick="createEvent('hello')"> ADD </button>`
      });
      new google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map,marker);
      });
      
    }
  }

function backToDashboard() {
    location.assign('/dashboard.html')
}

function searchSpots(){
    let search = document.getElementById('search').value;
    //get (lat,lng) , name, city, details from local API 
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/googleplace?search=' + search);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                let response = JSON.parse(xhr.responseText);
                let { data } = response;
                data.map(d => {
                    createSearchEvent(d.spotName);
                })
            } else {

            }
        }
    }
    xhr.send();
    // createSearchEvent('test')
}


function createEvent(spotName){
    let eventContainer = document.getElementById('external-events');
    let event = document.createElement('div');
    event.className = 'fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event';
    eventContainer.appendChild(event);
    let eventDetails = document.createElement('div');
    eventDetails.className = 'fc-event-main';
    eventDetails.innerHTML = spotName;
    event.appendChild(eventDetails);
}

