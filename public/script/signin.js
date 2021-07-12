/* eslint-disable */

let accessToken = localStorage.getItem('access_token')
//document.cookie
if ( accessToken ) {
  location.assign('/dashboard.html')
}

function onSignIn(googleUser) {
  let profile = googleUser.getBasicProfile();
  let googleToken = googleUser.getAuthResponse().id_token;
  // signIn(profile.getEmail())
  signIn(googleToken)
}

function signIn(googleToken) {
  let email = document.getElementById('email').value;
  let password = document.getElementById('password-field').value;

  if (!googleToken && email.split('@').length != 2) {
    Swal.fire({
      icon: 'warning',
      title: '請輸入正確的電子郵件地址',
      showConfirmButton: false,
      timer: 700
    })
    return;
  }

  let user = {
    email: email,
    password: password,
    provider: 'native'
  };
  
  if (googleToken) {
    user = {
      provider: 'Google',
      googleToken,
      email: null,
      password: null,
    }
  } else {
    if(!email || !password) {
      Swal.fire({
        icon: 'warning',
        title: '請輸入密碼',
        showConfirmButton: false,
        timer: 700
      })
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
  xhr.open('POST', '/1.0/signin');
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {

        if (googleToken) {
          Swal.fire({
            icon: 'success',
            title: 'Signed in with Google',
            showConfirmButton: false,
            timer: 700
          })
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Signed in',
            showConfirmButton: false,
            timer: 700
          })
        }
        const serverResponse = JSON.parse(xhr.responseText);
        localStorage.setItem('access_token', serverResponse.data.access_token)
        // document.cookie = `access_token = ${serverResponse.data.access_token}`;
        
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
        Swal.fire({
          icon: 'warning',
          title: '密碼錯誤',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK',
        })
      } else if (xhr.status == 400) {
        Swal.fire({
          icon: 'warning',
          title: '尚未註冊，將導向至註冊頁面',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK',
        }).then((result) => {
          if (result.isConfirmed) {
            location.assign('/signup.html');
          } 
        })
      }
    }

  };

  //send data
  xhr.send(userData);
}
  