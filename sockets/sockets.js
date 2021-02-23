// Listen for socket events

const async = require('async');

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
    callback();
  });

  // User sends the first message, creates a chat object
  socket.on('send_first_message', (params, callback) => {
    callback();
  });
};
