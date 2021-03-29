// Get the list of chats, sorted alphabetically
// XMLHTTP Request

const Chat = require('../../../models/chat/Chat');

module.exports = (req, res) => {
  Chat.getChats(req.session.user._id, req.query, (err, chats) => {
    if (err) {
      res.write(JSON.stringify({ error: err, success: false }));
      return res.end();
    }

    res.write(JSON.stringify({
      success: true,
      chats
    }));
    return res.end();
  });
}
