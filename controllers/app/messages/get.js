// Get the list of messages of the given chat
// XMLHTTP Request

const Chat = require('../../../models/chat/Chat');

module.exports = (req, res) => {
  Chat.getChatMessages(req.session.user._id, req.query, (err, messages) => {
    if (err) {
      res.write(JSON.stringify({ error: err, success: false }));
      return res.end();
    }

    res.write(JSON.stringify({
      success: true,
      messages
    }));
    return res.end();
  })
}
