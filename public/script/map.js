function backToDashboard() {
  location.assign('/dashboard.html')
}

// Maps API
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

//init pending arrangements list
window.addEventListener('storage', ()=>{
  getPendingArrangements(null, JSON.parse(localStorage.getItem('trip_settings')).id);
})

function popUpAddSpot(spotName, placeId) {
  Swal.fire({
    position: 'center-end',
    title: '是否新增景點：<br>"' + spotName +'"',
    showCancelButton: true,
    confirmButtonText: 'OK',
    confirmButtonColor: '#3085d6'
  }).then((result) => {
    if (result.isConfirmed) {
      saveSpotInfo(spotName, placeId);
    } 
  })
}

function saveSpotInfo(spotName, placeId) {
  let data = {
    spotName,
    placeId,
    tripId: JSON.parse(localStorage.getItem('trip_settings')).id
  }
  let xhr = new XMLHttpRequest();
  xhr.open('POST', '/spot');
  xhr.onreadystatechange = function () {
    if(xhr.readyState == 4) {
      if(xhr.status == 200) {
        console.log('reload getPendingArrangements for save spot INfo');
        getPendingArrangements(null, data.tripId)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: '景點新增失敗，請再試一次或聯絡網站管理員',
        }) 
      }
    }
  }
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
  xhr.send(JSON.stringify(data));
}

function getPendingArrangements(city, tripId) {
  let xhr = new XMLHttpRequest();
  if (city) {
    xhr.open('GET', `/arrangement?status=pending&id=${tripId}&city=${city}`);
  } else {
    xhr.open('GET', `/arrangement?status=pending&id=${tripId}`);
  }
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        let response = JSON.parse(xhr.responseText);
        let { cities, spots } = response;
    
        //append spots
        let spotsContainer = document.getElementById('external-events');
        spotsContainer.innerHTML = '';
        spots.map( s =>{
          let spot = document.createElement('div');
          spot.className = 'fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event';
          spot.setAttribute('id', s.google_id)
          spot.setAttribute('ondblclick', `removeEvent('${s.spot_id}', '${tripId}')`)
          spotsContainer.appendChild(spot);
          let spotDetails = document.createElement('div');
          spotDetails.className = 'fc-event-main';
          spotDetails.innerHTML = `${s.name}<br>@ ${s.city}`;
          spotDetails.dataset.place_id = s.google_id;
          spot.appendChild(spotDetails); 
        })
    
        //append cities
        let citiesContainer = document.getElementById('cities-container');
        citiesContainer.innerHTML = '';
        let showAll = document.createElement('div');
        showAll.className = 'city';
        showAll.innerHTML = '顯示全部';
        showAll.setAttribute('onclick', `getPendingArrangements(${null}, ${tripId})`);
        citiesContainer.appendChild(showAll)
        cities.map(cityName => {
          let city = document.createElement('div');
          city.className = 'city';
          city.innerHTML = cityName;
          city.setAttribute('onclick', `getPendingArrangements('${cityName}', ${tripId})`);
          citiesContainer.appendChild(city)
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: '景點重整失敗，請再試一次或聯絡網站管理員',
        }) 
      }
    }
  }
  xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
  xhr.send();
}

function removeEvent(spotId, tripId) {
  Swal.fire({
    position: 'top-end',
    title: '確認刪除景點',
    text: "刪除後您將必須重新搜尋並加回清單",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'OK'
  }).then((result) => {
    if (result.isConfirmed) {
      //set is_arranged to -1 and reload spot list
      let data = {
        spotId,
        tripId
      }
      let xhr = new XMLHttpRequest();
      xhr.open('DELETE', '/arrangement');
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            getPendingArrangements(null, tripId);
        }
      }
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.send(JSON.stringify(data));      

    }
  })
}


