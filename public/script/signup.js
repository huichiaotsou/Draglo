/* eslint-disable */

let accessToken = localStorage.getItem('access_token')
//document.cookie
if (accessToken) {
  location.assign('/dashboard.html')
}

function signUp() {
    let email = document.getElementById('email').value;
    let password = document.getElementById('password-field').value;
    let confirmPassword = document.getElementById('password-repeat').value;

    if (!email || !password || !confirmPassword){
      Swal.fire({
        icon: 'warning',
        title: '請輸入完整資訊',
        showConfirmButton: false,
        timer: 700
      })
        return;
    }

    if (email.split('@').length != 2) {
      Swal.fire({
        icon: 'warning',
        title: '請輸入正確的電子郵件地址',
        showConfirmButton: false,
        timer: 700
      })
      return;
    }

    if (password != confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: '兩次輸入的密碼不相同',
        showConfirmButton: false,
        timer: 700
      })
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
    xhr.open('POST', '/1.0/signup');
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
          localStorage.setItem('access_token', serverResponse.data.access_token)
          // document.cookie = `access_token = ${serverResponse.data.access_token}`;

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
          Swal.fire({
            icon: 'warning',
            title: '電子信箱已註冊，將導向至登入頁面',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              location.assign('/index.html');
            } 
          })
        } else {
          Swal.fire({
            icon: 'warning',
            title: xhr.responseText,
            showConfirmButton: false,
            timer: 700
          })
        }
      };
    };
  
    //send data
    xhr.send(userData);
  }