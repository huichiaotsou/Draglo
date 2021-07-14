function createTrip() {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/1.0/trip');
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status !== 200) {
        alert('Create Trip failed, please try again later');
      }
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        window.location.assign(`/trip.html?id=${response.tripId}&status=new`);
      }
    }
  };
  const accessToken = localStorage.getItem('access_token');
  xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
  xhr.send();
}

function jumpTo(content) {
  document.getElementById(content).scrollIntoView();
}

window.addEventListener('load', () => {
  window.resizeTo(2000, 2000);
  jumpTo('content1');
});
