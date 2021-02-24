const async = require('async');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const validator = require('validator');

const checkTimezone = require('./functions/checkTimezone');
const formatMessage = require('./functions/formatMessage');

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  type: {
    // Type of the message, allowed values: [text, file, image]
    type: String,
    required: true
  },
  content: {
    // Content of the message, text message for text type and a aws url for file and image
    type: String,
    required: true
  },
  chat_id: {
    // Id of the chat the message belons to
    type: mongoose.Types.ObjectId,
    required: true
  },
  sender_id: {
    // Id of the sender of the message
    type: mongoose.Types.ObjectId,
    required: true
  },
  read_by: {
    // Array of ids, showing the users read the message
    type: Array,
    default: []
  },
  created_at: {
    // The milliseconds time the message is created, in UNIX time
    type: Number,
    // default: moment().tz('Etc/GMT0').valueOf() 
    default: Date.now()
  },
  replied_message: {
    // An object reflecting the message the message was a reply to. Fields: {_id, type, content, sender_id}
    type: Object,
    default: null
  }
});

MessageSchema.statics.createMessage = function (data, callback) {
  // Create a new message object with the given data and index messages, return the message id or an error if it exists

  const allowedMessageTypes = ['text', 'image', 'file'];
  const maxMessageContentLength = 10000;

  if (!data || typeof data != 'object' || !data.type || !allowedMessageTypes.includes(data.type) || !data.sender_id || !validator.isMongoId(data.sender_id.toString()) || !data.chat_id || !validator.isMongoId(data.chat_id.toString()) || !data.content || typeof data.content != 'string' || !data.content.trim().length || data.content.trim().length > maxMessageContentLength)
    return callback('bad_request');

  const Message = this;

  if (data.replied_message && validator.isMongoId(data.replied_message.toString())) {
    Message.findById(mongoose.Types.ObjectId(data.replied_message.toString()), (err, message) => {
      if (err || !message)
        return callback('document_not_found');

      const newMessageData = {
        type: data.type,
        content: data.content.trim(),
        chat_id: mongoose.Types.ObjectId(data.chat_id.toString()),
        sender_id: mongoose.Types.ObjectId(data.sender_id.toString()),
        read_by: (data.read_by && Array.isArray(data.read_by) && !data.read_by.filter(id => !validator.isMongoId(id.toString()).length) ? data.read_by : []),
        replied_message: {
          _id: message._id,
          type: message.type,
          content: message.content,
          sender_id: message.sender_id
        }
      };

      const newMessage = new Message(newMessageData);

      newMessage.save((err, message) => {
        if (err || !message)
          return callback('database_error');

        Message.collection
          .createIndex({
            chat_id: -1, 
            created_at: -1
          })
          .then(() => callback(null, message._id.toString()))
          .catch(err => callback('indexing_error'));
      });
    });
  } else {
    const newMessageData = {
      type: data.type,
      content: data.content.trim(),
      chat_id: mongoose.Types.ObjectId(data.chat_id.toString()),
      sender_id: mongoose.Types.ObjectId(data.sender_id.toString()),
      read_by: (data.read_by && Array.isArray(data.read_by) && !data.read_by.filter(id => !validator.isMongoId(id.toString()).length) ? data.read_by : [])
    };
  
    const newMessage = new Message(newMessageData);

    newMessage.save((err, message) => {
      if (err || !message)
        return callback('database_error');

      Message.collection
        .createIndex({
          chat_id: -1, 
          created_at: -1
        })
        .then(() => callback(null, message._id.toString()))
        .catch(err => callback('indexing_error'));
    });
  }
};

MessageSchema.statics.getMessagesOfChat = function (data, callback) {
  // Get messages of the chat with the given id

  if (!data || typeof data != 'object' || !data.chat_id || !validator.isMongoId(data.chat_id.toString()) || !checkTimezone(data.timezone))
    return callback('bad_request');

  const Message = this;

  if (!data.limit || isNaN(parseInt(data.limit)) || parseInt(data.limit) > 200)
    data.limit = 100;

  if (!data.skip || isNaN(parseInt(data.skip)))
    data.skip = 0;

  Message
    .find({
      chat_id: mongoose.Types.ObjectId(data.chat_id.toString())
    })
    .sort({ created_at: 1 })
    .skip(parseInt(data.skip) * parseInt(data.limit))
    .limit(parseInt(data.limit))
    .then(messages => {
      async.timesSeries(
        messages.length,
        (time, next) => formatMessage({
          message: messages[time],
          timezone: parseInt(data.timezone)
        }, (err, message) => next(err, message)),
        (err, messages) => callback(err, messages)
      );
    })
    .catch(err => {
      console.log(err);
      return callback('database_error');
    });
};

MessageSchema.statics.findMessageById = function (data, callback) {
  // Find the message with the given id and return it, or an error if it exists

  if (!data || typeof data != 'object' || !data._id || !validator.isMongoId(data._id.toString()) || !checkTimezone(data.timezone))
    return callback('bad_request');

  const Message = this;

  Message.findById(mongoose.Types.ObjectId(data._id.toString()), (err, message) => {
    if (err || !message)
      return callback('document_not_found');

    formatMessage({
      message,
      timezone: parseInt(data.timezone)
    }, (err, message) => callback(err, message));
  });
};

MessageSchema.statics.updateReadBy = function (id, user_id, callback) {
  // Find the document with the given id and push the user to read_by array
  // Return an error if it exists

  if (!id || !validator.isMongoId(id.toString()) || !user_id || !validator.isMongoId(user_id.toString()))
    return callback('bad_request');

  const Message = this;

  Message.findOneAndUpdate({
    _id: mongoose.Types.ObjectId(id.toString),
    read_by: {$ne: user_id}
  }, {$push: {
    read_by: mongoose.Types.ObjectId(user_id)
  }}, err => {
    if (err) return callback('database_error');

    return callback(null);
  });
};

MessageSchema.statics.getLatestMessage = function (id, callback) {
  // Find the message with the given chat_id and latest created_at time, return it or an error if it exists

  if (!id || !validator.isMongoId(id.toString()))
    return callback('bad_request');

  const Message = this;

  Message
    .find({
      chat_id: mongoose.Types.ObjectId(id.toString())
    })
    .sort({ created_at: -1 })
    .limit(1) // Take only the latest
    .then(messages => callback(null, messages.length ? messages[0] : null))
    .catch(() => callback('database_error'));
};

module.exports = mongoose.model('Message', MessageSchema);
