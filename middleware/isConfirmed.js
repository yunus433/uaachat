// Check if the user's account is confirmed, if not redirect to /auth/confirm

const User = require('../models/user/User');

module.exports = (req, res, next) => {
  const user = req.session.user;

  if (user.is_confirmed)
    return next();

  User.submitConfirmationCode(user._id, err => {
    console.log(err);
    if (err) return res.redirect('/auth/login');

    return res.redirect('/auth/confirm');
  });
}
