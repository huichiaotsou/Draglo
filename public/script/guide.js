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
  jumpTo('content1');
});

setInterval(() => {
  let nextButtons = document.querySelectorAll('.next-button')
  for(let i=0; i < nextButtons.length; i++) {
    nextButtons[i].style.backgroundColor = 'green';
  }

  setTimeout(() => {
    let nextButtons = document.querySelectorAll('.next-button')
    for (let i=0; i < nextButtons.length; i++) {
      nextButtons[i].style.backgroundColor = '#5cb85c';
    }
  }, 500);
}, 1000);


