// /auth/login POST controller
// XMLHTTP Request

const User = require('../../../models/user/User');

module.exports = (req, res) => {
  User.findUser(req.body ? req.body.email : null, req.body ? req.body.password : null, (err, user) => {
    if (err || !user) {
      res.write(JSON.stringify({ error: err, success: false }));
      return res.end();
    }

    req.session.user = user;

    res.write(JSON.stringify({ success: true }));
    return res.end();
  });
}
