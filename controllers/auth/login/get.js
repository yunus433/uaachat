// /auth/login GET page

module.exports = (req, res) => {
  return res.render('auth/login', {
    page: 'auth/login',
    title: 'Login',
    includes: {
      external: {
        css: ['page', 'general', 'header', 'fontawesome'],
        js: ['page', 'serverRequest']
      }
    },
    backgroundImage: 2
  });
}
