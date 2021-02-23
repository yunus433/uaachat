// Send a new message
// XMLHTTP Request

const Chat = require('../../../models/chat/Chat');
const Message = require('../../../models/message/Message');
const User = require('../../../models/user/User');

module.exports = (req, res) => {
  if (!req.body || !req.body.sender_id || req.body.sender_id.toString() != req.session.user._id) {
    res.write(JSON.stringify({ error: 'not_authenticated_request', success: false }));
    return res.end();
  }

  if (req.body && req.body.chat_id) {
    Message.createMessage(req.body, (err, message_id) => {
      if (err) {
        res.write(JSON.stringify({ error: err, success: false }));
        return res.end();
      }

      Message.findMessageById({
        _id: message_id,
        timezone: 0
      }, (err, message) => {
        if (err) {
          res.write(JSON.stringify({ error: err, success: false }));
          return res.end();
        }

        Chat.findChatById(message.chat_id, (err, chat) => {
          if (err) {
            res.write(JSON.stringify({ error: err, success: false }));
            return res.end();
          }

          Chat.updateLastMessageTime(message.chat_id, err => {
            if (err) {
              res.write(JSON.stringify({ error: err, success: false }));
              return res.end();
            }

            if (chat.is_group) {
              res.write(JSON.stringify({ message_id: message._id, success: true }));
              return res.end();
            } else {
              const user_id = chat.users_list.find(id => id != message.sender_id).toString();
  
              User.pushUserToChats(user_id, message.sender_id, err => {
                if (err) {
                  res.write(JSON.stringify({ error: err, success: false }));
                  return res.end();
                }
  
                User.pushUserToChats(message.sender_id, user_id, err => {
                  if (err) {
                    res.write(JSON.stringify({ error: err, success: false }));
                    return res.end();
                  }
  
                  res.write(JSON.stringify({ message_id: message._id, success: true }));
                  return res.end();
                });
              });
            };
          });
        });
      });
    });
  } else {
    Chat.createChat(req.body, (err, chat_id) => {
      if (err) {
        res.write(JSON.stringify({ error: err, success: false }));
        return res.end();
      }
  
      req.body.chat_id = chat_id;
  
      Message.createMessage(req.body, (err, message_id) => {
        if (err) {
          res.write(JSON.stringify({ error: err, success: false }));
          return res.end();
        }
  
        Message.findMessageById({
          _id: message_id,
          timezone: 0
        }, (err, message) => {
          if (err) {
            res.write(JSON.stringify({ error: err, success: false }));
            return res.end();
          }
  
          Chat.findChatById(message.chat_id, (err, chat) => {
            if (err) {
              res.write(JSON.stringify({ error: err, success: false }));
              return res.end();
            }

            Chat.updateLastMessageTime(message.chat_id, err => {
              if (err) {
                res.write(JSON.stringify({ error: err, success: false }));
                return res.end();
              }

              if (chat.is_group) {
                res.write(JSON.stringify({ message_id: message._id, success: true }));
                return res.end();
              } else {
                const user_id = chat.users_list.find(id => id != message.sender_id).toString();
    
                User.pushUserToChats(user_id, message.sender_id, err => {
                  if (err) {
                    res.write(JSON.stringify({ error: err, success: false }));
                    return res.end();
                  }
    
                  User.pushUserToChats(message.sender_id, user_id, err => {
                    if (err) {
                      res.write(JSON.stringify({ error: err, success: false }));
                      return res.end();
                    }
    
                    res.write(JSON.stringify({ message_id: message._id, success: true }));
                    return res.end();
                  });
                });
              };
            });
          });
        });
      });
    });
  }
}
