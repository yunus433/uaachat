// Get the list of possible contacts, sorted alphabetically
// XMLHTTP Request

const User = require('../../../models/user/User');

module.exports = (req, res) => {
  User.getContacts(req.session.user._id, req.query, req.query, (err, contacts) => {
    if (err) {
      res.write(JSON.stringify({ error: err, success: false }));
      return res.end();
    }

    res.write(JSON.stringify({
      success: true,
      contacts
    }));
    return res.end();
  });
}
