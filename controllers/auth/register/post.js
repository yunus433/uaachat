// /auth/register POST page
// XMLHTTP Request

const User = require('../../../models/user/User');

module.exports = (req, res) => {
  User.createUser(req.body, (err, user) => {
    if (err) {
      res.write(JSON.stringify({ error: err, success: false }));
      return res.end();
    }
    
    req.session.user = user;
    
    res.write(JSON.stringify({ success: true }));
    return res.end();
  });
}
