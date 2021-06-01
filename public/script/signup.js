if (document.cookie) {
  location.assign('/dashboard.html')
}

function signUp() {
    let email = document.getElementById('email').value;
    let password = document.getElementById('password-field').value;
    let confirmPassword = document.getElementById('password-repeat').value;

    if (!email || !password || !confirmPassword){
        alert('Please provide complete information')
        return;
    }
    if (password != confirmPassword) {
        alert('Passwords are not identical');
        return;
    }

    let user = {
      email: email,
      password: password,
    };
    
    let shareToken = localStorage.getItem('share_token');
    if (shareToken) {
      user.shareToken = shareToken;
    }
  
    let userData = JSON.stringify(user);
  
    //AJAX
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/signup');
    xhr.setRequestHeader('Content-Type', 'application/json');
  
    //status check
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          Swal.fire({
            icon: 'success',
            title: '註冊成功',
            showConfirmButton: false,
            timer: 700
          })
          const serverResponse = JSON.parse(xhr.responseText);
          document.cookie = `access_token = ${serverResponse.data.access_token}`;

          if (shareToken) {
            setTimeout(()=>{
              localStorage.removeItem('share_token');
              window.location.assign(`/trip.html?id=${serverResponse.tripId}`);
            }, 700)
          } else {
            setTimeout(()=>{
              window.location.assign('/dashboard.html');
            }, 700)
          }
        } else if (xhr.status == 403) {
          alert(xhr.responseText);
          location.assign('/index.html');
        } else {
          alert(xhr.responseText);
        }
      };
    };
  
    //send data
    xhr.send(userData);
  }