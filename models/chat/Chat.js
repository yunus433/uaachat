const async = require('async');
const mongoose = require('mongoose');
const validator = require('validator');

const Message = require('../message/Message');
const User = require('../user/User');

const Schema = mongoose.Schema;
const possibleColors = [
  "#946E83",
  "#715AFF",
  "#55C1FF",
  "#E4C3AD",
  "#8F250C",
  "#CA5310",
  "#FBBA72",
  "#2E294E",
  "#D7263D",
  "#F46036",
  "#2E294E",
  "#1B998B",
  "#C5D86D",
  "#1C77C3",
  "#F39237",
  "#D63230",
  "#1E3F20",
  "#1A1F16",
  "#81523F",
  "#3F2A2B",
  "#CE796B",
  "#512500",
  "#7D1D3F",
  "#6B2D5C",
  "#462255",
  "#313B72",
  "#574AE2",
  "#FFC53A",
  "#161032",
  "#FED766",
  "#011627",
  "#3B0D11",
  "#A52422",
  "#E8D33F",
  "#F19A3E"
];

const ChatSchema = new Schema({
  is_group: {
    // If the document a group chat or single chat
    type: Boolean,
    required: true
  },
  users_list: {
    // The list of user ids of the chat
    type: Array,
    required: true
  },
  users_colors: {
    // The object keeping the color of each user in the chat
    type: Object,
    required: true
  },
  last_message_time: {
    // The time of the last message, milliseconds from UNIX time
    type: Number,
    default: (new Date).getTime()
  },
  created_at: {
    // The time the chat is created
    type: Date,
    default: Date.now()
  }
});

ChatSchema.statics.createChat = function (data, callback) {
  // Create a new chat document with the given id, return the new document id or an error if it exists

  if (!data || typeof data != 'object' || !data.users || !Array.isArray(data.users) || data.users.filter(id => !validator.isMongoId(id.toString())).length)
    return callback('bad_request');

  const Chat = this;

  const newChatData = {
    is_group: false,
    users_list: data.users.map(user => mongoose.Types.ObjectId(user.toString())),
    users_colors: {}
  };

  for (let i = 0; i < data.users.length; i++)
    newChatData.users_colors[data.users[i].toString()] = possibleColors[ (parseInt(Math.random() * possibleColors.length)) ];

  const newChat = new Chat(newChatData);

  newChat.save((err, chat) => {
    if (err || !chat)
      return callback('database_error');

    Chat.collection
      .createIndex({
        users_list: 1,
        last_message_time: 1
      })
      .then(() => callback(null, chat._id.toString()))
      .catch(() => callback('indexing_error'));
  });
};

ChatSchema.statics.updateLastMessageTime = function (id, callback) {
  // Find the document with given id, get the latest document from the Message model, updates last message time
  // Return an error if it exists

  const Chat = this;

  Message.getLatestMessage(id, null, (err, message) => {
    if (err) return callback(err);

    if (!message)
      return callback(null);

    Chat.findByIdAndUpdate(mongoose.Types.ObjectId(id.toString()), {$set: {
      last_message_time: message.created_at
    }}, err => {
      if (err) return callback('database_error');

      Chat.collection
        .createIndex({
          users_list: 1,
          last_message_time: 1
        })
        .then(() => callback(null))
        .catch(err => callback('indexing_error'));
    });
  });
};

ChatSchema.statics.getChats = function (id, filters_data, callback) {
  // Finds all user documents that are on the chats field of the user with the given id and returns them if they are matching filter, sorted by name
  // Spesify name (string that the name of users should match) in filters, optional

  if (!id || !validator.isMongoId(id.toString()) || !filters_data || typeof filters_data != 'object')
    return callback('bad_request');

  const filters = {};

  const Chat = this;

  User.findById(mongoose.Types.ObjectId(id.toString()), (err, user) => {
    if (err || !user) return callback('document_not_found');

    filters.$and = [
      {users_list: { $in: user.chats }},
      {users_list: mongoose.Types.ObjectId(id.toString())}
    ];

    Chat
      .find(filters)
      .sort({ last_message_time: -1 })
      .then(chats => { // Find recent chats in user chats array
        const user_filters = {};

        if (filters_data.name && typeof filters_data.name == 'string')
          user_filters.name = {
            $regex: filters_data.name,
            $options: 'is'
          };

        async.times(
          chats.length,
          (time, next) => {
            const chat_id = chats[time]._id.toString();

            user_filters.$and = [
              {_id: {$in: chats[time].users_list}},
              {_id: {$ne: mongoose.Types.ObjectId(id.toString())}}
            ];

            User.findOne(user_filters, (err, user) => {
              if (err) return next('database_error');
              if (!user) return next(null, null);

              Message.getLatestMessage(chat_id, filters_data, (err, message) => {
                if (err) return next(err);

                Message.getNotReadMessageNumberOfChat(chat_id, id, (err, number) => {
                  if (err) return next(err);

                  User.getUserById(
                    user._id,
                    (err, user) => next(err, {
                      _id: chat_id,
                      user_id: user._id,
                      profile_photo: user.profile_photo,
                      name: user.name,
                      email: user.email,
                      last_message: message,
                      not_read_message_number: number
                    })
                  );
                });
              });
            });
          },
          (err, chats) => {
            if (err) return callback(err);

            return callback(null, chats.filter(chat => chat && chat._id))
          }
        );
      })
      .catch(err => callback('database_error'));
  });
};

ChatSchema.statics.findChatById = function (id, callback) {
  // Find the chat with the given id, return it or an error if it exists

  if (!id || !validator.isMongoId(id.toString()))
    return callback('bad_request');

  const Chat = this;

  Chat.findById(mongoose.Types.ObjectId(id.toString()), (err, chat) => {
    if (err || !chat) return callback('document_not_found');

    return callback(null, chat);
  });
};

ChatSchema.statics.findChatInfo = function (id, user_id, callback) {
  // Find the chat with the given id, return it on the proper format for frontend or an error if it exists
  
  if (!id || !validator.isMongoId(id.toString()) || !user_id || !validator.isMongoId(user_id.toString()))
    return callback('bad_request');

  const Chat = this;

  Chat.findOne({
    _id: mongoose.Types.ObjectId(id.toString()),
    is_group: false,
    users_list: mongoose.Types.ObjectId(user_id.toString())
  }, (err, chat) => {
    if (err || !chat)
      return callback('document_not_found');

    const otherUserId = chat.users_list.find(id => id != mongoose.Types.ObjectId(user_id.toString()) && id != user_id.toString());

    User.getUserById(otherUserId, (err, user) => {
      if (err) return callback(err);

      return callback(null, {
        _id: chat._id,
        user_id: user._id,
        profile_photo: user.profile_photo,
        name: user.name,
        email: user.email
      });
    });
  });
};

ChatSchema.statics.getChatMessages = function (user_id, data, callback) {
  // Find the document with given it and checks if the user with the given id can access this chat
  // If the request is authenticated find and return the messages of the chat

  if (!user_id || !validator.isMongoId(user_id.toString()) || typeof data != 'object' || !data.chat_id || !validator.isMongoId(data.chat_id.toString()))
    return callback('bad_request');

  const Chat = this;

  Chat.findOne({
    _id: mongoose.Types.ObjectId(data.chat_id.toString()),
    users_list: mongoose.Types.ObjectId(user_id.toString())
  }, (err, chat) => {
    if (err)
      return callback('database_error');
    if (!chat)
      return callback(null, []);

    Message.getMessagesOfChat(data, user_id, (err, messages) => callback(err, messages));
  });
};

module.exports = mongoose.model('Chat', ChatSchema);
