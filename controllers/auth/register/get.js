// /auth/register GET page

module.exports = (req, res) => {
  return res.render('auth/register', {
    page: 'auth/register',
    title: 'Register',
    includes: {
      external: {
        css: ['page', 'general', 'header', 'fontawesome'],
        js: ['page', 'serverRequest']
      }
    },
    backgroundImage: 3
  });
}
