// let accessToken = document.cookie.split('=')[1];
let accessToken = localStorage.getItem('access_token')
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get('id');
if (accessToken) {
    // 驗tripid 是否屬於author or contributors
    getTripSettings(accessToken, tripId);
} else { 
    location.assign('/index.html');
}

window.addEventListener('load', ()=>{
    let status = urlParams.get('status');
    if (status == 'new') {
        initTripPeriod()
    }
})

function initTripPeriod() {
    Swal.fire({
        position: 'top',
        title: '設定旅行區間',
        confirmButtonColor: '#3085d6',
        confirmButtonText: `確認`,
        showDenyButton: true,
        denyButtonText: `取消`,
        denyButtonColor: '#d33',
        html: `
            <div style="margin-bottom: 20px;">您可以隨時在旅程設定中更改</div>
            <label>開始日期：</label><input id="start-date" type="date" name="start-date" placeholder="YYYY-MM-DD"><br>
            <label>結束日期：</label><input id="end-date" type="date" name="end-date" placeholder="YYYY-MM-DD">
            `,
      }).then((result) => {
        if (result.isConfirmed) {
            let startDate = document.getElementById('start-date').value
            let endDate = document.getElementById('end-date').value
            if (startDate < endDate) {
                startDate = new Date(startDate + 'T00:00:00.000Z')
                endDate = new Date(endDate + 'T00:00:00.000Z')
                endDate.setDate(endDate.getDate() + 1)
                modifyTripDuration(tripId, startDate, endDate) 
                location.assign(`/trip.html?id=${tripId}`)
            } else {
                Swal.fire({
                    position: 'top',
                    title: '日期錯誤',
                    text: "結束日期早於開始日期",
                    icon: 'warning',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: '重新設定',
                    showDenyButton: true,
                    denyButtonText: `取消`,
                    denyButtonColor: '#d33',
                  }).then((result) => {
                    if (result.isConfirmed) {
                       return initTripPeriod()
                    } else if (result.isDenied) {
                        location.assign(`/trip.html?id=${tripId}`)
                    }
                  })
            }
        } else if (result.isDenied) {
            location.assign(`/trip.html?id=${tripId}`)
        }

    })
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


function changeTripPeriod() {
    let tripSettingsString = localStorage.getItem('trip_settings');
    let tripSettings = JSON.parse(tripSettingsString);
    Swal.fire({
        position: 'top-end',
        title: '設定旅行區間',
        showDenyButton: true,
        confirmButtonColor: '#3085d6',
        confirmButtonText: `開始日期`,
        denyButtonText: `結束日期`,
      }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                position: 'top-end',
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
                        modifyTripDuration(tripId, newStartDate, new Date(newStartDatePushBack.setDate(newStartDatePushBack.getDate() + 7)));
                    } else {
                        modifyTripDuration(tripId, newStartDate, currentTripEnd);
                    }
                }
              })
              document.getElementById('start-date').value = tripSettings.trip_start.split('T')[0];
        } else if (result.isDenied) {
            Swal.fire({
                position: 'top-end',
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
                            position: 'top-end',
                            icon: 'error',
                            title: 'Oops...',
                            text: '行程結束日不得早於開始日',
                          })
                    } else {
                        newEndDate.setDate(newEndDate.getDate() + 1)
                        modifyTripDuration(tripId, currentTripStart, newEndDate);
                    }
                }
            })
            document.getElementById('end-date').value = tripSettings.trip_end.split('T')[0];
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
                    position: 'top-end',
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
                    }, 700);
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
                    setTimeout(()=>{
                        location.reload();
                    }, 1000);
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
            position: 'top-end',
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

function shareTrip(){
    Swal.fire({
        position: 'top-end',
        title: '<p>想要發邀請函給誰呢？</p>',
        html:`<input id="share-email" type="text" placeholder="電子郵件信箱"
        style="border-radius: 5px; height: 40px; width: 300px;">`,
        showCloseButton: true,
        focusConfirm: false,
        confirmButtonColor: '#3085d6',
        confirmButtonText: `OK`
    }).then((result) => {
        if (result.isConfirmed) {
            let tripSettings = JSON.parse(localStorage.getItem('trip_settings'))
            let data = {
                tripId: tripId,
                title: tripSettings.name
            }
            let email = document.getElementById('share-email').value
            data.email = email;
            Swal.fire({
                position: 'top-end',
                icon: 'success',
                title: '邀請函傳送成功，請點擊邀請連結取得權限',
                showConfirmButton: false,
                timer: 1000
            })
            let xhr = new XMLHttpRequest()
            xhr.open('POST', `/share`);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    console.log('OK');
                }
            }
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
            xhr.send(JSON.stringify(data));
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
    console.log('google sign out');
    let auth2 = gapi.auth2.getAuthInstance();
    console.log(auth2);
    auth2.signOut().then(function () {
      console.log('User signed out.');
    });
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
        position: 'top-end',
        title: '是否確定清空行事曆?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: '確認清除',
        cancelButtonText:'取消'
      }).then((result) => {
        if (result.isConfirmed) {
            let xhr = new XMLHttpRequest()
            xhr.open('PATCH', '/arrangement');
            xhr.onreadystatechange = function () {
              if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    location.reload()
                } else if (xhr.status == 403){
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
            xhr.send(JSON.stringify({tripId}));
        }
      })
}

function createiCalFeed(data){
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/calendar');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                Swal.fire({
                    position: 'top-end',
                    title: 'iCalendar Feed 已建立',
                    html:`
                    
                    <div>此旅程的日曆網址為：</div>
                    <div style="display: flex; justify-content:space-around; margin-top: 20px;">
                        <input type="text" style="font-size: 17px; width: 70%;" id="ical-feed" value="${xhr.responseText}">
                        <button class="btn btn-sm btn-outline-primary" type="button" onclick="copyLink()" id="copy-btn">複製網址</button> <br>
                    </div>
                    <br><a href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl" target="_blank"><div>點擊匯入至 Google Calendar</div></a>
                    <div style="font-size: 12px; margin-top: 7px;">若您先前已匯入，Google Calendar將自動更新（根據Google更新速度）</div>
                    `,
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: `OK`
                })
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
    copyBtn.innerHTML = '已複製';
    copyBtn.className = 'btn btn-sm btn-outline-secondary'
}