if (document.cookie) {
  location.assign('/dashboard.html')
}

function onSignIn(googleUser) {
  let profile = googleUser.getBasicProfile();
  console.log(profile);
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
  signIn(profile.getEmail())
}

function signIn(gmail) {
  let email = document.getElementById('email').value;
  let password = document.getElementById('password-field').value;

  let user = {
    email: email,
    password: password,
  };
  
  if (gmail) {
    user = {
      email: gmail,
      password: 'googleSignInDraglo',
    }
  } else {
    if(!email || !password) {
      alert('please enter login information')
      return;
    }
  }

  let shareToken = localStorage.getItem('share_token');
  if (shareToken) {
    user.shareToken = shareToken;
  }
  
  let userData = JSON.stringify(user);
  
  //AJAX
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/signin');
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        Swal.fire({
          icon: 'success',
          title: '登入成功',
          showConfirmButton: false,
          timer: 700
      })
        const serverResponse = JSON.parse(xhr.responseText);
        document.cookie = `access_token = ${serverResponse.data.access_token}`;
        
        if (shareToken) {
          setTimeout(()=>{
            localStorage.removeItem('share_token');
            window.location.assign(`/trip.html?id=${serverResponse.tripId}`);
          }, 1200)
        } else {
          setTimeout(()=>{
            window.location.assign('/dashboard.html');
          }, 700)
        }
      } else if (xhr.status == 403) {
        alert(xhr.responseText);
      } else if (xhr.status == 400) {
        alert(xhr.responseText);
        location.assign('/signup.html');
      }
    }

  };

  //send data
  xhr.send(userData);
}
  