window.onload = () => {
  const formWrapper = document.querySelector('.all-content-login-wrapper');
  const formError = document.querySelector('.form-error');

  formWrapper.onsubmit = event => {
    event.preventDefault();

    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    formError.innerHTML = '';

    if (!email.length || !password.length)
      return formError.innerHTML = 'Please enter your email and password';

      serverRequest('/auth/login', 'POST', {
        email,
        password
      }, res => {
        if (res.success) {
          return window.location = '/app';
        } else {
          if (res.error == 'document_not_found' || res.error == 'bad_request') {
            return formError.innerHTML = 'This account does not exist';
          } else if (res.error == 'password_verification') {
            return formError.innerHTML = 'Your password is not correct';
          } else if (res.error == 'network_error') {
            return formError.innerHTML = 'Please check your internet connection and try again';
          } else {
            return formError.innerHTML = 'An unknown error occured, please try again later';
          }
        }
      });
  }
}
