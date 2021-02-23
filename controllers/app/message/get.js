// Get a message object with the given id in a usable format for client side, spesify timezone
// XMLHTTP Request

const moment = require('moment-timezone');

const Chat = require('../../../models/chat/Chat');
const Message = require('../../../models/message/Message');

module.exports = (req, res) => {
  Message.findMessageById(req.query, (err, message) => {
    if (err) {
      res.write(JSON.stringify({ error: err, success: false }));
      return res.end();
    }

    Chat.findChatById(message.chat_id, (err, chat) => {
      if (err) {
        res.write(JSON.stringify({ error: err, success: false }));
        return res.end();
      }

      if (!chat || !chat.users_list.includes(req.session.user._id)) {
        res.write(JSON.stringify({ error: 'not_authenticated_request', success: false }));
        return res.end();
      }

      res.write(JSON.stringify({
        success: true,
        message
      }));
      return res.end();
    });
  });
}
