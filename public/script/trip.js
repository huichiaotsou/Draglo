// This sample requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 23.9036873, lng: 121.0793705 },
    zoom: 2,
  });
  const input = document.getElementById("pac-input");
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo("bounds", map);
  // Specify just the place data fields that you need.
  autocomplete.setFields(["place_id", "geometry", "name", "formatted_address"]);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  const infowindow = new google.maps.InfoWindow();
  const infowindowContent = document.getElementById("infowindow-content");
  infowindow.setContent(infowindowContent);
  const geocoder = new google.maps.Geocoder();
  autocomplete.addListener("place_changed", () => {
    infowindow.close();
    const place = autocomplete.getPlace();
    
    const marker = new google.maps.Marker({ map: map });
    marker.addListener("click", () => {
      popUpAddSpot(place.name, place.place_id);
    });

    if (!place.place_id) {
      return;
    }
    geocoder.geocode({ placeId: place.place_id }, (results, status) => {
      if (status !== "OK" && results) {
        window.alert("Search failed due to: " + status);
        return;
      }
      map.setZoom(14);
      map.setCenter(results[0].geometry.location);
      // Set the position of the marker using the place ID and location.
      marker.setPlace({
        placeId: place.place_id,
        location: results[0].geometry.location,
      });
      marker.setVisible(true);

      infowindowContent.children["place-name"].textContent = place.name;
      infowindowContent.children["place-id"].textContent = place.name;
      infowindowContent.children["place-address"].textContent = results[0].formatted_address;
      infowindow.open(map, marker);
    });
  });
}

function popUpAddSpot(spotName, placeId) {
  if (confirm('是否新增景點："' + spotName +'"' )) {
    // Save it!
    createEvent(spotName, placeId)
  } else {
    // Do nothing!
  }  
}

function createEvent(spotName, placeId){
    let eventContainer = document.getElementById('external-events');
    let event = document.createElement('div');
    event.className = 'fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event';
    event.setAttribute('id', placeId)
    event.setAttribute('ondblclick', `removeEvent('${placeId}')`)
    eventContainer.appendChild(event);
    let eventDetails = document.createElement('div');
    eventDetails.className = 'fc-event-main';
    eventDetails.innerHTML = spotName;
    eventDetails.dataset.place_id = placeId;
    event.appendChild(eventDetails);
}

function removeEvent(placeId) {
  let eventContainer = document.getElementById('external-events');
  let event = document.getElementById(placeId);
  eventContainer.removeChild(event);
}

function backToDashboard() {
  location.assign('/dashboard.html')
}

