// Listen for socket events

const async = require('async');
const validator = require('validator');

const Chat = require('../models/chat/Chat');
const Message = require('../models/message/Message');
const User = require('../models/user/User');

module.exports = (socket, io) => {
  // User joins the room with its own id
  socket.on('join', params => {
    socket.join(params.room.toString());
  });

  // User leaves the room with its own id
  socket.on('leave', params => {
    socket.leave(params.room.toString());
  });

  // User sends a new message to an existing chat
  socket.on('send_message', (params, callback) => {
    if (!params || !params.message_id || !validator.isMongoId(params.message_id.toString()))
      return callback('bad_request');

    Message.findMessageById({ _id: params.message_id, timezone: 0 }, (err, message) => {
      if (err) return callback(err);

      Chat.findChatById(message.chat_id, (err, chat) => {
        if (err) return callback(err);
  
        async.times(
          chat.users_list.length,
          (time, next) => {
            const user_id = chat.users_list[time];

            if (user_id == message.sender_id) // Do not send the message to sender
              return next(null);

            const roomLength = io.nsps['/'].adapter.rooms[user_id.toString()] ? io.nsps['/'].adapter.rooms[user_id.toString()].length : 0; // Get the list of users in room. Expected to be one. Each user has its own room
            
            if (roomLength) {
              socket.to(user_id).emit('new_message', {
                message
              }, (err, read) => {
                if (err) return next('client_side_error');

                if (read) { // The message is read
                  Message.updateReadBy(message._id, user_id, err => {
                    if (err) return next(err);

                    return next(null);
                  });
                } else {
                  return next(null); 
                }
              });
            } else { // Not online
              return next(null); // Do nothing
            }
          },
          err => {
            if (err) return callback(err);

            Message.findMessageById(params.message_id, (err, message) => { // Get the message again to send the latest version to client
              if (err) return callback(err);

              return callback(null, message);
            });
          }
        );
      });
    });
  });

  // User sends the first message, creates a chat object
  socket.on('send_first_message', (params, callback) => {
    if (!params || !params.message_id || validator.isMongoId(params.message_id.toString()))
      return callback('bad_request');

    Message.findMessageById(params.message_id, (err, message) => {
      if (err) return callback(err);

      Chat.findChatById(message.chat_id, (err, chat) => {
        if (err) return callback(err);
  
        async.times(
          chat.users_list,
          (time, next) => {
            const user_id = chat.users_list[time];

            if (user == message.sender_id) // Do not send the message to sender
              return next(null);

            const room = io.sockets.clients(user_id); // Get the list of users in room. Expected to be one. Each user has its own room
            
            if (room.length) {
              socket.to(user_id).emit('new_first_message', {
                message
              }, (err, read) => {
                if (err) return next('client_side_error');

                if (read) { // The message is read
                  Message.updateReadBy(message._id, user_id, err => {
                    if (err) return next(err);

                    return next(null);
                  });
                } else {
                  return next(null); 
                }
              });
            } else { // Not online
              return next(null); // Do nothing
            }
          },
          err => {
            if (err) return callback(err);

            Message.findMessageById(params.message_id, (err, message) => { // Get the message again to send the latest version to client
              if (err) return callback(err);
              
              return callback(null, message);
            });
          }
        );
      });
    });
  });
};
