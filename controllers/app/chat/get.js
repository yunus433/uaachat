// Find the Chat with the given id
// XMLHTTP Request

const Chat = require('../../../models/chat/Chat');

module.exports = (req, res) => {
  Chat.findChatInfo(req.query._id, req.session.user._id, (err, chat) => {
    if (err) {
      res.write(JSON.stringify({ error: err, success: false }));
      return res.end();
    }

    res.write(JSON.stringify({
      success: true,
      chat
    }));
    return res.end();
  })
}
