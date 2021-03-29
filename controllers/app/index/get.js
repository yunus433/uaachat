// /auth GET page

module.exports = (req, res) => {
  return res.render('app/index', {
    page: 'app/index',
    title: 'Your Private Chat',
    includes: {
      external: {
        css: ['page', 'general', 'fontawesome', 'app'],
        js: ['page', 'serverRequest']
      }
    },
    user: req.session.user
  });
}
