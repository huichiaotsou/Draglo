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
    console.log(password);
    console.log(confirmPassword);
    if (password != confirmPassword) {
        alert('Passwords are not identical');
        return;
    }

    let user = {
      email: email,
      password: password,
    };
  
    let userData = JSON.stringify(user);
  
    //AJAX
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/signup');
    xhr.setRequestHeader('Content-Type', 'application/json');
  
    //status check
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const serverResponse = JSON.parse(xhr.responseText);
          document.cookie = `access_token = ${serverResponse.data.access_token}`;
          alert('註冊成功');
          location.assign('/dashboard.html');
        } else if (xhr.status === 403) {
          alert('Email已被使用，請登入');
          location.assign('/signin.html');
        }
      };
    };
  
    //send data
    xhr.send(userData);
  }