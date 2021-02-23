// Get the index page

module.exports = (req, res) => {
  return res.render('index/index', {
    page: 'index/index',
    title: 'The Private Chat of UAA',
    includes: {
      external: {
        css: ['page', 'general', 'header']
      }
    },
    backgroundImage: 1
  });
}
