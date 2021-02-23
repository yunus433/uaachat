window.onload = () => {
  const formWrapper = document.querySelector('.all-content-register-wrapper');
  const formError = document.querySelector('.form-error');

  formWrapper.onsubmit = event => {
    event.preventDefault();

    const email = document.getElementById('email-input').value;
    const name = document.getElementById('name-input').value;
    const password = document.getElementById('password-input').value;
    const confirmPassword = document.getElementById('confirm-password-input').value;
    formError.innerHTML = '';

    if (!email.length || !name.length || !password.length || !confirmPassword.length)
      return formError.innerHTML = 'Please enter your email, name, password and confirm your password';

    if (password.length < 6)
      return formError.innerHTML = 'Your password should be at least 6 digits';

    if (password != confirmPassword)
      return formError.innerHTML = 'Please confirm your password';

    serverRequest('/auth/register', 'POST', {
      email,
      name,
      password
    }, res => {
      if (res.success) {
        return window.location = '/app';
      } else {
        if (res.error == 'email_validation') {
          return formError.innerHTML = 'Please enter a valid email';
        } else if (res.error == 'email_duplication') {
          return formError.innerHTML = 'This email address is already in use';
        } else if (res.error == 'email_authentication') {
          return formError.innerHTML = 'Please use your school email: @my.uaa.k12.tr';
        } else if (res.error == 'network_error') {
          return formError.innerHTML = 'Please check your internet connection and try again';
        } else {
          return formError.innerHTML = 'An unknown error occured, please try again later';
        }
      }
    });
  };
}
