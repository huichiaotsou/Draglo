/* eslint-disable */

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
    xhr.open('POST', '/1.0/trip');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status != 200) {
              alert('Create Trip failed, please try again later');
          }
          if(xhr.status == 200) {
              let response = JSON.parse(xhr.responseText); 
              location.assign(`/trip.html?id=${response.tripId}&status=new`);
          }
        }
    }
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send();
}

function nativeSignOut() {
    Swal.fire({
        icon: 'success',
        title: 'See ya! :)',
        showConfirmButton: false,
        timer: 700,
      });
    localStorage.removeItem('access_token')
    // document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setTimeout(()=>{
        location.assign('/index.html');
    }, 700)
}

function googleSignOut() {
    let auth2 = window.gapi.auth2.getAuthInstance();
    auth2.signOut()
  }

  // function onLoad() {
  //   gapi.load('auth2', function() {
  //     gapi.auth2.init();
  //   });
  // }

function getDashboard(behavior){
    let container = document.getElementById('trips-container');
    let keyword = document.getElementById('keyword').value;
    let xhr = new XMLHttpRequest();
    if (keyword) {
        xhr.open('GET', `/1.0/dashboard?keyword=${keyword}`);
        container.innerHTML = "";
    } else if (behavior == 'archived'){
        xhr.open('GET', '/1.0/dashboard?archived=true');
        container.innerHTML = "";
    } else if (behavior == 'shared') {
        xhr.open('GET', '/1.0/dashboard?shared=true');
        container.innerHTML = "";
    } else {
        xhr.open('GET', '/1.0/dashboard');
    }
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status != 200) {
          alert('Please sign in again!');
          // document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          localStorage.removeItem('access_token')
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
                      let tripEnd = new Date (d.trip_end)
                      tripEnd.setDate(tripEnd.getDate() - 1)
                      tripEnd = tripEnd.toISOString().split('T')[0];
                      tripDuration.className = "trip-duration";
                      tripDuration.innerHTML = tripStart + " ~ " + tripEnd;
                      tripBlock.appendChild(tripDuration);
                  }, 650)
              }
            } else {
                 if(behavior == 'archived') {
                  let noArchivedImg = document.createElement('img');
                  noArchivedImg.src = '/images/no_archived.png'
                  noArchivedImg.style.width = '500px'
                  noArchivedImg.style.height = '500px'
                  container.append(noArchivedImg)
                } else if (behavior == 'shared') {
                  let noSharedImg = document.createElement('img');
                  noSharedImg.src = '/images/no_shared.png'
                  noSharedImg.style.width = '500px'
                  noSharedImg.style.height = '500px'
                  container.append(noSharedImg)
                } 
                else if (behavior == null) {
                  container.innerHTML = ""
                  let link = document.createElement('a');
                  link.href = '/guide.html'
                  container.appendChild(link);
                  let tripBlock = document.createElement('div');
                  tripBlock.className = "trip-block";
                  tripBlock.style.width = '500px';
                  tripBlock.style.height = '270px'
                  link.appendChild(tripBlock);
                  let tripImg = document.createElement('img');
                  tripImg.className = "trip-img";
                  tripImg.src = "images/how_to_draglo.png";
                  tripBlock.appendChild(tripImg);
                  // let tripTitle = document.createElement('p');
                  // tripTitle.className = "trip-title";
                  // tripTitle.innerHTML = `
                  // <div style='letter-spacing: 0.7px;'>Create Your Trip Now!</div>
                  // `
                  // tripBlock.appendChild(tripTitle);
                } 
                else if(behavior == 'search') {
                  let noSearchImg = document.createElement('img');
                  noSearchImg.src = '/images/no_search.png'
                  noSearchImg.style.width = '500px'
                  noSearchImg.style.height = '500px'
                  container.append(noSearchImg)
                }
            }        
        }
      }
    };
  
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send();
}
