//veriry identity, if ok, render user's trips / if not, alert: please log in again
let accessToken = document.cookie.split('=')[1];
if (accessToken) {
    getDashboard()
} else { //if no token, redirect to sign in page
    location.assign('/signin.html');
}

function signOut() {
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    location.assign('/signin.html');
}

let container = document.getElementById('trips-container');
function getDashboard(behavior){
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
        if (xhr.status !== 200) {
          alert('Please sign in again!');
          document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          window.location.assign('/signin.html');
        } else if (xhr.status === 200) {
          let response = JSON.parse(xhr.responseText);
          let data = response.data;
          //clear default and render user's trips information
          if(data.length > 0) {
              container.innerHTML = '';
          }
          data.map( d => {
              let link = document.createElement('a');
              link.href = "trip?id=" + d.trip_id;
              container.appendChild(link);
              let tripBlock = document.createElement('div');
              tripBlock.className = "trip-block"
              link.appendChild(tripBlock);
              let tripImg = document.createElement('div');
              tripImg.className = "trip-img";
              tripImg.setAttribute('style', 'background-image: url('+ d.image +');')
              tripBlock.appendChild(tripImg);
              let tripTitle = document.createElement('p');
              tripTitle.className = "trip-title";
              tripTitle.innerHTML = d.name;
              tripBlock.appendChild(tripTitle);
              let tripDuration = document.createElement('p');
              tripDuration.className = "trip-duration";
              tripDuration.innerHTML = d.trip_start + " ~ " + d.trip_end;
              tripBlock.appendChild(tripDuration);
          })
        }
      }
    };
  
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send();
}