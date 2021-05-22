if (document.cookie) {
  location.assign('/dashboard.html')
}

function signIn() {
    let email = document.getElementById('email').value;
    let password = document.getElementById('password-field').value;
    if(!email || !password) {
        alert('please enter login information')
        return;
    }
    let user = {
      email: email,
      password: password,
    };
  
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
          setTimeout(()=>{
            window.location.assign('/dashboard.html');
          }, 700)
        } else if (xhr.status === 403) {
          alert(xhr.responseText);
        } else if (xhr.status === 400) {
          alert(xhr.responseText);
          location.assign('/signup.html');
        }
      }
  
    };
  
    //send data
    xhr.send(userData);
  }
  