// Check if there is an account information on session, redirect to /auth/login if the request is not logged in

const User = require('../models/user/User');

module.exports = (req, res, next) => {
  if (req.session && req.session.user) { // If logged in
    User.getUserById(req.session.user._id, (err, user) => {
      if (err || !user) return res.status(401).redirect('/auth/login');;
      
      req.session.user = user; // Update session
      return next();
    });
  } else {
    if (req.file && req.file.filename) { // If already a file is uploaded on the server
      fs.unlink('./public/res/uploads/' + req.file.filename, () => { // Delete the file, as it is not authenticated
        req.session.redirect = req.originalUrl; // Save redirection url
        return res.status(401).redirect('/auth/login');
      });
    } else {
      req.session.redirect = req.originalUrl; // Save redirection url
      return res.status(401).redirect('/auth/login');
    }
  };
};
