let accessToken = document.cookie.split('=')[1];
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get('id');
if (accessToken) {
    // 驗tripid 是否屬於author or contributors
    getTripSettings(accessToken, tripId);
} else { 
    location.assign('/index.html');
}

function getTripSettings(accessToken, tripId) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `/trip?id=${tripId}`);
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

function changeTripPeriod() {
    let tripSettingsString = localStorage.getItem('trip_settings');
    let tripSettings = JSON.parse(tripSettingsString);
    Swal.fire({
        position: 'top-start',
        title: '設定旅行區間',
        showDenyButton: true,
        confirmButtonColor: '#3085d6',
        confirmButtonText: `開始日期`,
        denyButtonText: `結束日期`,
      }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                position: 'top-start',
                title: '設定開始日期',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                confirmButtonText: `OK`,
                html: `<input id="start-date" type="date" name="start-date" placeholder="YYYY-MM-DD">
                <h5 style="padding-top:20px;">（目前： ${tripSettings.trip_start.split('T')[0]}）</h5>`,
              }).then((result) => {
                if (result.isConfirmed) {
                    let newStartDate = new Date(document.getElementById('start-date').value + 'T00:00:00.000Z');
                    let currentTripEnd = new Date(tripSettings.trip_end) //format: 2021-09-17T16:00:00.000Z
                    if (newStartDate > currentTripEnd) {
                        let newStartDatePushBack = new Date(newStartDate.getTime()); //clone Date object
                        modifyTripDuration(tripId, newStartDate, new Date(newStartDatePushBack.setDate(newStartDatePushBack.getDate() + 6)));
                    } else {
                        modifyTripDuration(tripId, newStartDate, currentTripEnd);
                    }
                }
              })
        } else if (result.isDenied) {
            Swal.fire({
                position: 'top-start',
                title: '設定結束日期',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                confirmButtonText: `OK`,
                html: `<input id="end-date" type="date" placeholder="YYYY-MM-DD">
                <h5 style="padding-top:20px;">（目前： ${tripSettings.trip_end.split('T')[0]}）</h5>`,
              }).then((result) => {
                if (result.isConfirmed) {
                    let newEndDate = new Date(document.getElementById('end-date').value + 'T00:00:00.000Z');
                    let currentTripStart = new Date(tripSettings.trip_start)
                    if (newEndDate < currentTripStart) {
                        Swal.fire({
                            position: 'top-start',
                            icon: 'error',
                            title: 'Oops...',
                            text: '行程結束日不得早於開始日',
                          })                          
                    } else {
                        modifyTripDuration(tripId, currentTripStart, newEndDate);
                    }
                }
              })
        }
      })      
}

function modifyTripDuration(tripId, tripStart, tripEnd) {
    let data = { 
        tripId,
        tripStart,
        tripEnd,
        modify: 'duration'
    }
    let xhr = new XMLHttpRequest();
    xhr.open('PATCH', '/trip')
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status == 200) {
                getTripSettings(accessToken, tripId);
                Swal.fire({
                    position: 'top-start',
                    icon: 'success',
                    title: '修改成功',
                    showConfirmButton: false,
                    timer: 1000
                })
            } else if (xhr.status == 403) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: '您的權限不足',
                  })                  
            } else {
                alert('Server Error, please try again later')
            }
        }
    }
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send(JSON.stringify(data));
}

function updateTripName() {
    let data = {
        tripId,
        tripName: document.getElementById('trip-name').value,
        modify: "name"
    }
    let xhr = new XMLHttpRequest();
    xhr.open('PATCH', '/trip');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                getTripSettings(accessToken, tripId);
                Swal.fire({
                    icon: 'success',
                    title: '修改成功',
                    showConfirmButton: false,
                    timer: 1000
                })
            } else if (xhr.status == 403) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: '您的權限不足',
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
        tripId,
        archived: action,
        tripName: document.getElementById('trip-name').value,
        modify: "archived",
    }
    let xhr = new XMLHttpRequest();
    xhr.open('PATCH', '/trip');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                getTripSettings(accessToken, tripId);
                if (action == 1) {
                    Swal.fire({
                        icon: 'success',
                        title: '封存成功',
                        showConfirmButton: false,
                        timer: 1000
                    })
                    setTimeout(()=>{
                        location.assign('/dashboard.html');
                    }, 1000);
                } else if (action == 2) {
                    Swal.fire({
                        icon: 'success',
                        title: '刪除成功',
                        showConfirmButton: false,
                        timer: 1000
                    })
                    setTimeout(()=>{
                        location.assign('/dashboard.html');
                    }, 1000);
                } else if (action == 0) {
                    Swal.fire({
                        icon: 'success',
                        title: '行程復原成功',
                        showConfirmButton: false,
                        timer: 1000
                    })
                }
            } else if (xhr.status == 403) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: '您的權限不足',
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
            title: '是否確定刪除行程?',
            text: "刪除的行程將無法復原",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '確認刪除',
            cancelButtonText:'取消'
          }).then((result) => {
            if (result.isConfirmed) {
                xhr.send(JSON.stringify(data));
            }
          })
          
    }
}

//decide if drop down menu visible: 
window.addEventListener('storage', ()=>{
    let tripSettingsString = localStorage.getItem('trip_settings');
    let tripSettings = JSON.parse(tripSettingsString);
    let isArchived = tripSettings.is_archived
    if(isArchived == 0) {
        let recoverBtn = document.getElementById('recover-trip')
        recoverBtn.style.display = 'none';
    } else if (isArchived == 1) {
        let archiveBtn = document.getElementById('archive-trip')
        archiveBtn.style.display = 'none';
    }
})

function signOut() {
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    location.assign('/index.html');
}

//clear local storage
window.addEventListener('beforeunload', ()=>{
    localStorage.removeItem('trip_settings');
})
