// /auth/confirm GET page

module.exports = (req, res) => {
  return res.render('auth/confirm', {
    page: 'auth/confirm',
    title: 'Confirm',
    includes: {
      external: {
        css: ['page', 'general', 'header', 'fontawesome'],
        js: ['page', 'serverRequest']
      }
    },
    backgroundImage: 4
  });
}
