window.onload = () => {
  const formWrapper = document.querySelector('.all-content-confirm-wrapper');
  const formError = document.querySelector('.form-error');

  formWrapper.onsubmit = event => {
    event.preventDefault();

    const code = document.getElementById('code-input').value;
    formError.innerHTML = '';

    if (code.length != 8)
      return formError.innerHTML = 'Your code should be 8 digits long';

      serverRequest('/auth/confirm', 'POST', { code }, res => {
        if (res.success || res.error == 'already_authenticated') {
          return window.location = '/app';
        } else {
          if (res.error == 'document_validation') {
            return formError.innerHTML = 'The code you entered is not correct';
          } else if (res.error == 'request_timeout') {
            return formError.innerHTML = 'This code is timeout. Please relogin to take a new confirmation email';
          }  else if (res.error == 'network_error') {
            return formError.innerHTML = 'Please check your internet connection and try again';
          } else {
            return formError.innerHTML = 'An unknown error occured, please try again later';
          }
        }
      });
  }
}
