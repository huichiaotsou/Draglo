/* eslint-disable */
const accessToken = localStorage.getItem('access_token')
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get('id');

window.addEventListener('load', ()=>{
    if (accessToken) {
        getTripSettings(accessToken, tripId);
    } else { 
        location.assign('/index.html');
    }
})

window.addEventListener('storage', ()=> {
    if (urlParams.get('status') == 'new') {
      urlParams.delete('status');
      setTripPeriod('middle');
    }
})

function setTripPeriod(position) {
    Swal.fire({
        position: position,
        title: `When do you plan to travel?`,
        confirmButtonColor: '#3085d6',
        confirmButtonText: `OK`,
        showDenyButton: true,
        denyButtonText: `Cancel`,
        denyButtonColor: '#d33',
        allowOutsideClick: false,
        html: `
            <div style="margin-bottom: 20px;">the duration can also be modified in the "Settings"</div>
            <label>From </label><input id="start-date" type="date" name="start-date" placeholder="YYYY-MM-DD" style="width: 155px; margin-left:8px;"><br>
            <label>To </label><input id="end-date" type="date" name="end-date" placeholder="YYYY-MM-DD" style="width: 155px; margin-left:27px;">
            `,
      }).then((result) => {
        if (result.isConfirmed) {
            let startDate = document.getElementById('start-date').value
            let endDate = document.getElementById('end-date').value
            if ((new Date(endDate) - new Date(startDate))/(1000*60*60*24) > 20) {
                Swal.fire({
                    position: position,
                    title: 'Too Long :(',
                    text: 'The longest accepted period is 20 days',
                    icon: 'warning',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Reconfigure',
                    showDenyButton: true,
                    denyButtonText: `cancel`,
                    denyButtonColor: '#d33',
                    allowOutsideClick: false,
                  }).then((result) => {
                    if (result.isConfirmed) {
                       return setTripPeriod(position)
                    } else if (result.isDenied) {
                        location.assign(`/trip.html?id=${tripId}`)
                    }
                  })
                } else if (startDate > endDate){
                    Swal.fire({
                        position: position,
                        title: 'Wrong date',
                        text: "Trip end is earlier than trip start",
                        icon: 'warning',
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: 'Reconfigure',
                        showDenyButton: true,
                        denyButtonText: `Cancel`,
                        denyButtonColor: '#d33',
                        allowOutsideClick: false,
                    }).then((result) => {
                        if (result.isConfirmed) {
                            return setTripPeriod(position)
                        } else if (result.isDenied) {
                            location.assign(`/trip.html?id=${tripId}`)
                        }
                    })
                } else {
                    startDate = new Date(startDate + 'T00:00:00.000Z')
                    endDate = new Date(endDate + 'T00:00:00.000Z')
                    endDate.setDate(endDate.getDate() + 1)
                    modifyTripDuration(tripId, startDate, endDate) 
                }
            } 
            // else if (result.isDenied) {
            //     location.assign(`/trip.html?id=${tripId}`)
            // }
        })
        let settings = JSON.parse(localStorage.getItem('trip_settings'));
        let initStartDate = document.getElementById('start-date');
    initStartDate.value = settings['trip_start'].split('T')[0]
    let initEndDate = document.getElementById('end-date');
    initEndDate.value = settings['trip_end'].split('T')[0]
}

function getTripSettings(accessToken, tripId) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `/1.0/trip?id=${tripId}`);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status == 403) {
              alert('You do not have access to this trip');
              location.assign('/dashboard.html');
          } else if (xhr.status == 400) {
              alert('trip id undefined');
              location.assign('/dashboard.html');
          } else if (xhr.status == 200) {
              // render Tripinfo
              let response = xhr.responseText
              //reset existing data for relaoding 
              localStorage.removeItem('trip_settings');
              localStorage.setItem('trip_settings', response);
              
              let { otherTrips }  = JSON.parse(response);
              let tripList = document.getElementById('account-setting');
              let tripDivs = document.querySelectorAll('.other-trips');
              
              //preventing trip list from accumulating
              if (tripDivs.length > 0) {
                tripDivs.forEach(t => {
                    tripList.removeChild(t);
                })
              }
              otherTrips.map(t => {
                let trip = document.createElement('a');
                trip.className = "dropdown-item other-trips";
                trip.innerHTML = t.name;
                trip.href = '/trip.html?id=' + t.id
                tripList.appendChild(trip);
              })
              //trigger calendar loader
              window.dispatchEvent( new Event('storage') )
              let data = JSON.parse(response);
              document.getElementById('trip-name').value = data.name;
          }
        }
    }
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send();
}

function changeDayStart() {
    Swal.fire({
        position: 'top-end',
        title: '<p>設定每日外出時間</p>',
        html:`
        <div><span id="chosen-hour">9</span>點</div>
        <input id="range-bar" type="range" class="form-range" min="6" max="15" id="customRange2">
        `,
        showCloseButton: true,
        focusConfirm: false,
        confirmButtonColor: '#3085d6',
        confirmButtonText: `OK`
    }).then((result) => {
        if (result.isConfirmed) {
            let dayStart = rangeBar.value * 60;
            document.getElementById('calculateTrip').dataset.dayStart = dayStart;
        }
    })
    
    let rangeBar = document.getElementById('range-bar')
      rangeBar.value = document.getElementById('calculateTrip').dataset.dayStart / 60;
      let chosenHour = document.getElementById('chosen-hour')
      chosenHour.innerHTML = rangeBar.value
      rangeBar.addEventListener('change', ()=>{
        chosenHour.innerHTML = rangeBar.value;
      })
}

function modifyTripDuration(tripId, tripStart, tripEnd) {
    let data = { 
        tripStart,
        tripEnd,
        modify: 'duration'
    }
    let xhr = new XMLHttpRequest();
    let requestRoute = `/1.0/trip/${tripId}`
    xhr.open('PATCH', requestRoute);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status == 204) {
                getTripSettings(accessToken, tripId);
                Swal.fire({
                    icon: 'success',
                    title: 'OK',
                    showConfirmButton: false,
                    timer: 1000
                })
                setTimeout(() => {
                  location.assign(`/trip.html?id=${tripId}`)
                }, 1000);
            } else if (xhr.status == 403) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Access Denied',
                  })                  
            } else {
                alert(xhr.responseText);
            }
        }
    }
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send(JSON.stringify(data));
}

function updateTripName() {
    let data = {
        tripName: document.getElementById('trip-name').value,
        modify: "name"
    }
    let xhr = new XMLHttpRequest();
    let requestRoute = `/1.0/trip/${tripId}`
    xhr.open('PATCH', requestRoute);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 204) {
                getTripSettings(accessToken, tripId);
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    showConfirmButton: false,
                    timer: 1000
                })
            } else if (xhr.status == 403) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Access Denied',
                  })     
            }
        }
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send(JSON.stringify(data));
}

//action = 0, restores/not archived
//action = 1, archived
//action = 2, deleted
function archiveTrip(action) {
    let data = {
        archived: action,
        tripName: document.getElementById('trip-name').value,
        modify: "archived",
    }
    let xhr = new XMLHttpRequest();
    let requestRoute = `/1.0/trip/${tripId}`
    xhr.open('PATCH', requestRoute);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 204) {
                getTripSettings(accessToken, tripId);
                if (action == 1) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Trip has been archived',
                        showConfirmButton: false,
                        timer: 1000
                    })
                    setTimeout(()=>{
                        location.assign('/dashboard.html');
                    }, 700);
                } else if (action == 2) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Trip has been deleted',
                        showConfirmButton: false,
                        timer: 1000
                    })
                    setTimeout(()=>{
                        location.assign('/dashboard.html');
                    }, 1000);
                } else if (action == 0) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Trip has been restored',
                        showConfirmButton: false,
                        timer: 1000
                    })
                    setTimeout(()=>{
                        location.reload();
                    }, 1000);
                }
            } else if (xhr.status == 403) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Access Denied',
                  })
            }
        }
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    if (action == 0 || action == 1) {
        xhr.send(JSON.stringify(data));
    } else if (action == 2) {
        //確認刪除
        Swal.fire({
            position: 'top-start',
            title: 'You are deleting the trip',
            text: "Deleted trips are not restorable",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            // cancelButtonColor: '#3085d6',
            confirmButtonText: 'I am aware',
            cancelButtonText:'Cancel'
          }).then((result) => {
            if (result.isConfirmed) {
                xhr.send(JSON.stringify(data));
            }
          })
          
    }
}

function shareTrip(){
    Swal.fire({
        position: 'top-start',
        title: '<p>Send the access link <br>to your friends!</p>',
        html:`<input id="share-email" type="text" placeholder=" Enter email address"
        style="border-radius: 5px; height: 40px; width: 300px;">`,
        focusConfirm: false,
        confirmButtonColor: '#3085d6',
        confirmButtonText: `OK`
    }).then((result) => {
        if (result.isConfirmed) {
            let email = document.getElementById('share-email').value
            if (email && email.split('@').length > 1) {
                let tripSettings = JSON.parse(localStorage.getItem('trip_settings'))
                let data = {
                    tripId: tripId,
                    title: tripSettings.name
                }
                let email = document.getElementById('share-email').value
                data.email = email;
                Swal.fire({
                    position: 'top-start',
                    icon: 'success',
                    title: 'The Invitation has been sent.<br>Please use the link in the email<br> to obtain trip access',
                    showConfirmButton: true,
                    confirmButtonColor: '#3085d6',

                })
                let xhr = new XMLHttpRequest()
                xhr.open('POST', '/1.0/share');
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                xhr.send(JSON.stringify(data));
            } else {
                Swal.fire({
                    position: 'top-start',
                    icon: 'warning',
                    title: 'Please enter email address',
                    showConfirmButton: false,
                    timer: 1000
                })
            }
        }
    })
          
}

//decide if drop down menu visible: 
window.addEventListener('storage', ()=>{
    let tripSettingsString = localStorage.getItem('trip_settings');
    let tripSettings = JSON.parse(tripSettingsString);
    let isArchived = tripSettings.is_archived
    if(isArchived == 0) { //active trips, hide recover button
        let recoverBtn = document.getElementById('recover-trip')
        recoverBtn.style.display = 'none';
    }
    if (isArchived == 1) { //archived trip, hide archive button
        let archiveBtn = document.getElementById('archive-trip')
        archiveBtn.style.display = 'none';
        document.getElementById('archive-banner').style.display = 'block';
    }
})

function NativeSignOut() {
    // document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem('access_token');
    location.assign('/index.html');
}

function googleSignOut() {
    let auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut()
  }

  function onLoad() {
    gapi.load('auth2', function() {
      gapi.auth2.init();
    });
  }

//clear local storage
window.addEventListener('beforeunload', ()=>{
    localStorage.removeItem('trip_settings');
})

function clearTrip() {
    Swal.fire({
        position: 'top-start',
        title: 'It can not be undone',
        text:'Do you want to clear all the arrangements?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Clear it',
        cancelButtonText:'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
            let xhr = new XMLHttpRequest()
            let requestRoute = `/1.0/arrangement/${tripId}/cleartrip`
            xhr.open('PATCH', requestRoute);
            xhr.onreadystatechange = function () {
              if (xhr.readyState == 4) {
                if (xhr.status == 204) {
                  location.reload()
                } else if (xhr.status == 403){
                  Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Access Denied',
                  })
                }
              }
            };
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
            xhr.send();
        }
      })
}

function createiCalFeed(data, action){
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/1.0/calendar');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                if (action == 'create') {
                    Swal.fire({
                        position: 'top-end',
                        title: 'iCalendar Feed',
                        html:`
                        <div>Use the link to import the schedule to your own calendar</div>
                        <div style="display: flex; justify-content:space-around; margin-top: 20px;">
                            <input type="text" style="font-size: 17px; width: 70%; margin-right:-10px;" id="ical-feed" value="${xhr.responseText}">
                            <button class="btn btn-sm btn-outline-primary" type="button" onclick="copyLink()" id="copy-btn">Copy URL</button> <br>
                        </div>
                        <div style="font-size: 12px; margin-top: 10px;">If you have already subscribed to the feed,<br> all the updates at Draglo will be automatically pushed to your calednar.</div>
                        <br><a href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl" target="_blank"><div>Access Google Calendar</div></a>
                        `,
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: `OK`
                    })
                }
            } else if (xhr.status != 200) {
                alert('update failed, please try again later')
            }
        } 
    }
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send(JSON.stringify(data));
}

function copyLink() {
    let link = document.getElementById('ical-feed');
    link.select();
    document.execCommand("copy");
    let copyBtn = document.getElementById('copy-btn')
    copyBtn.innerHTML = 'Copied!';
    copyBtn.className = 'btn btn-sm btn-outline-secondary'
}