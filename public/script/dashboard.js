//veriry identity, if ok, render user's trips / if not, alert: please log in again
let accessToken = localStorage.getItem('access_token')
// document.cookie.split('=')[1];
if (accessToken) {
    getDashboard()
} else { //if no token, redirect to sign in page
    location.assign('/index.html');
}

function createTrip() {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/trip');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status != 200) {
              alert('Create Trip failed, please try again later');
          }
          if(xhr.status == 200) {
              let response = JSON.parse(xhr.responseText); 
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: '建立新旅程',
                showConfirmButton: false,
                timer: 1100
              });
              setTimeout(()=>{
                  location.assign(`/trip.html?id=${response.tripId}`);
              }, 1100)
          }
        }
    }
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send();
}

function nativeSignOut() {
    Swal.fire({
        icon: 'success',
        title: '下次再會 :)',
        showConfirmButton: false,
        timer: 700
      });
    localStorage.removeItem('access_token')
    // document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setTimeout(()=>{
        location.assign('/index.html');
    }, 700)
}

function googleSignOut() {
    let auth2 = window.gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      console.log('User signed out.');
    });
  }

  function onLoad() {
    gapi.load('auth2', function() {
      gapi.auth2.init();
    });
  }

function getDashboard(behavior){
    let container = document.getElementById('trips-container');
    let keyword = document.getElementById('keyword').value;
    let xhr = new XMLHttpRequest();
    if (keyword) {
        xhr.open('GET', `/dashboard?keyword=${keyword}`);
        container.innerHTML = "";
    } else if (behavior == 'archived'){
        xhr.open('GET', '/dashboard?archived=true');
        container.innerHTML = "";
    } else if (behavior == 'shared') {
        xhr.open('GET', '/dashboard?shared=true');
        container.innerHTML = "";
    } else {
        xhr.open('GET', '/dashboard');
    }
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status != 200) {
          alert('Please sign in again!');
          document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          window.location.assign('/index.html');
        } else if (xhr.status == 200) {
          let response = JSON.parse(xhr.responseText);
          let data = response.data;
          //clear default and render user's trips information
          if(data.length > 0) {
              container.innerHTML = ""
              for (let d of data) {
                  let link = document.createElement('a');
                  link.href = "/trip.html?id=" + d.trip_id;
                  container.appendChild(link);
                  let tripBlock = document.createElement('div');
                  tripBlock.className = "trip-block";
                  link.appendChild(tripBlock);
                  let tripImg = document.createElement('img');
                  tripImg.className = "trip-img";
                  setTimeout(()=>{
                      tripImg.src = d.image;
                      tripBlock.appendChild(tripImg);
                      let tripTitle = document.createElement('p');
                      tripTitle.className = "trip-title";
                      tripTitle.innerHTML = d.name;
                      tripBlock.appendChild(tripTitle);
                      let tripDuration = document.createElement('p');
                      let tripStart = d.trip_start.split('T')[0];
                      let tripEnd = d.trip_end.split('T')[0];
                      tripDuration.className = "trip-duration";
                      tripDuration.innerHTML = tripStart + " ~ " + tripEnd;
                      tripBlock.appendChild(tripDuration);
                  }, 650)
              }
            } else {
                container.innerHTML = ""
                if (behavior == null) {
                    let link = document.createElement('a');
                    link.setAttribute('onclick', 'createTrip()')
                    container.appendChild(link);
                    let tripBlock = document.createElement('div');
                    tripBlock.className = "trip-block";
                    link.appendChild(tripBlock);
                    let tripImg = document.createElement('img');
                    tripImg.className = "trip-img";
                    tripImg.src = "images/bg.jpg";
                    tripBlock.appendChild(tripImg);
                    let tripTitle = document.createElement('p');
                    tripTitle.className = "trip-title";
                    tripTitle.innerHTML = '新增旅程';
                    tripBlock.appendChild(tripTitle);
                }
            }        
        }
      }
    };
  
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send();
}
