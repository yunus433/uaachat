const async = require('async');
const mongoose = require('mongoose');
const validator = require('validator');

const sendMail = require('../../utils/sendMail');

const getUser = require('./functions/getUser');
const hashPassword = require('./functions/hashPassword');
const verifyPassword = require('./functions/verifyPassword');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    // Email address of the user
    type: String,
    unique: true,
    minlength: 1,
    required: true
  },
  is_confirmed: {
    // If user confirmed his/her account from the mail
    type: Boolean,
    default: false
  },
  confirmation_code: {
    // Code of confirmation of the account
    type: Number,
    length: 8
  },
  confirmation_exp_date: {
    // The date the code will expire
    type: Number
  },
  password: {
    // Password of the user, saved hashed
    type: String,
    required: true,
    minlength: 6
  },
  is_teacher: {
    // If user is a teacher
    type: Boolean,
    default: false
  },
  name: {
    // Name of the user 
    type: String,
    required: true,
    maxlength: 1000
  },
  details: {
    // Details of the user, optional
    type: String,
    default: '',
    maxlength: 1000
  },
  profile_photo: {
    // URL of the profile photo of the user
    type: String,
    default: '/res/images/default/user.png',
    maxlength: 1000
  },
  chats: {
    // List of ids from User model of the users the user has a chat with
    type: Array,
    default: []
  },
  created_at: {
    // The time the user registered, miliseconds UNIX time
    type: Number,
    default: new Date().getTime()
  }
});

// Before saving the user to database, hash its password
UserSchema.pre('save', hashPassword);

UserSchema.statics.findUser = function (email, password, callback) {
  // Finds the user with the given email field, then verifies it with the given password
  // Returns the user or an error if there is one

  if (!email || !password || !validator.isEmail(email))
    return callback('bad_request');

  let User = this;

  User.findOne({ email }).then(user => { 
    if (!user)
      return callback('document_not_found');

    verifyPassword(password, user.password, res => {
      if (!res)
        return callback('password_verification');

      getUser(user, (err, user) => {
        if (err) return callback('unknown_error');

        return callback(null, user);
      });
    });
  });
};

UserSchema.statics.createUser = function (data, callback) {
  // Creates a new user document and returns it or an error if it exists

  if (!data || !data.email || !data.email.length || !data.name || !data.name.length || !data.password)
    return callback('bad_request');

  if (!validator.isEmail(data.email))
    return callback('email_validation');

  if (data.email.split('@')[1] != 'my.uaa.k12.tr')
    return callback('email_authentication')

  if (data.password.length < 6)
    return callback('password_length');

  const User = this;

  const newUserData = {
    email: data.email,
    name: data.name,
    password: data.password,
    is_teacher: (!isNaN(parseInt(data.email.split('@')[0].substring(data.email.split('@')[0].length-2, data.email.split('@')[0].length))) ? false : true)
  };

  const newUser = new User(newUserData);

  newUser.save((err, user) => {
    if (err && err.code == 11000) return callback('email_duplication');
    if (err) return callback('unknown_error');

    getUser(user, (err, user) => {
      if (err) return callback(err);

      callback(null, user);
    });
  });
};

UserSchema.statics.submitConfirmationCode = function (id, callback) {
  // Find the user with the given id and sends an email with a new confirmation code.
  // Return an error if it exists

  if (!id || !validator.isMongoId(id.toString()))
    return callback('bad_request');

  const User = this;

  let code = 0;
  for (let i = 0; i < 8; i++)
    code += Math.floor(Math.random() * 10) * Math.pow(10, i);
  const exp_time = 60 * 60 * 1000;

  User.findByIdAndUpdate(mongoose.Types.ObjectId(id.toString()), {$set: {
    confirmation_code: code,
    confirmation_exp_date: (new Date).getTime() + exp_time
  }}, {new: true}, (err, user) => {
    if (err || !user) return callback('database_error');

    sendMail({
      email: user.email,
      name: user.name.split(' ')[0],
      code: user.confirmation_code
    }, 'confirm_account', err => {
      if (err) return callback('email_submition');

      return callback();
    });
  });
};

UserSchema.statics.confirmUser = function (id, data, callback) {
  // Finds the user and confirms it if the code matches, updates the is_confirmed field if there is no error
  // Returns an error if it exists

  if (!id || !validator.isMongoId(id.toString()) || typeof data != 'object' || !data || !data.code || isNaN(parseInt(data.code)))
    return callback('bad_request');

  const User = this;

  User.findById(mongoose.Types.ObjectId(id.toString()), (err, user) => {
    if (err || !user) return callback('document_not_found');

    if (user.is_confirmed)
      return callback('already_authenticated');

    if (user.confirmation_code != parseInt(data.code))
      return callback('document_validation');

    if (user.confirmation_exp_date < (new Date).getTime())
      return callback('request_timeout');

    User.findByIdAndUpdate(mongoose.Types.ObjectId(id.toString()), {
      $set: {
        confirmation_code: null,
        confirmation_exp_date: null,
        is_confirmed: true,
      },
      $push: {
        chats: mongoose.Types.ObjectId(user._id.toString())
      }
    }, (err, user) => {
      if (err || !user) return callback('database_error');

      return callback(null);
    });
  });
};

UserSchema.statics.getUserById = function (id, callback) {
  // Finds the user with the given id and returns it or an error if it exists

  if (!id || !validator.isMongoId(id.toString()))
    return callback('bad_request');

  const User = this;

  User.findById(mongoose.Types.ObjectId(id), (err, user) => {
    if (err) return callback(err);

    getUser(user, (err, user) => {
      if (err) return callback(err);

      return callback(null, user);
    });
  });
};

UserSchema.statics.updateUserById = function (id, data, callback) {
  // Finds the user with the given id and updates it with the given information
  // Returns an error if it exists

  if (!id || !validator.isMongoId(id.toString()))
    return callback('bad_request');

  if (data.name && !data.name.length)
    return callback('bad_request');

  const User = this;

  User.findById(mongoose.Types.ObjectId(id.toString()), (err, user) => {
    if (err || !user) return callback('document_not_found');

    User.findByIdAndUpdate(mongoose.Types.ObjectId(id.toString()), {$set: {
      name: data.name ? data.name : user.name,
      details: data.details ? data.details : user.details,
      profile_photo: data.profile_photo ? (data.profile_photo.length ? data.profile_photo : '/res/images/default/user.png') : user.profile_photo,
      completed: data.name ? true : user.completed
    }}, err => {
      if (err) return callback(err);

      if (data.name && data.name != user.name)
        User.collection.createIndex(
          { name: 'text' },
          { default_language: 'turkish' }
        )
        .then(() => callback(null))
        .catch(err => callback(err));
      else
        return callback(null);
    });
  });
};

UserSchema.statics.getContacts = function (id, options_data, filters_data, callback) {
  // Finds all user documents that are not on the chats field of the user with the given id and returns them if they are matching filter, sorted by name
  // Spesify name (string that the name of users should match) in filters, optional
  // Spesify limit and skip on options, they are default to 100 and 0, respectively

  if (!id || !validator.isMongoId(id.toString()) || !options_data || typeof options_data != 'object' || !filters_data || typeof filters_data != 'object')
    return callback('bad_request');

  const filters = {};
  const options = {
    limit: ((!options_data.limit || isNaN(parseInt(options_data.limit))) ? 100 : parseInt(options_data.limit)),
    skip: (!options_data.skip || isNaN(parseInt(options_data.skip)) ? 0 : parseInt(options_data.skip))
  };

  if (filters_data.name && typeof filters_data.name == 'string')
    filters.name = { $text: {
      $search: filters_data.name
    } };

  const User = this;

  User.findById(mongoose.Types.ObjectId(id.toString()), (err, user) => {
    if (err || !user) return callback('document_not_found');

    filters._id = {$nin: user.chats};

    User
      .find(filters)
      .sort({ name: 1 })
      .skip( options.skip * options.limit )
      .limit( options.limit )
      .then(users => {
        async.times(
          users.length,
          (time, next) => getUser(users[time], (err, user) => next(err, user)),
          (err, users) => {
            if (err) return callback(err);

            return callback(null, users);
          }
        );
      })
      .catch(err => callback(err));
  });
};

UserSchema.statics.getChats = function (id, options_data, filters_data, callback) {
  // Finds all user documents that are on the chats field of the user with the given id and returns them if they are matching filter, sorted by name
  // Spesify name (string that the name of users should match) in filters, optional
  // Spesify limit and skip on options, they are default to 100 and 0, respectively

  if (!id || !validator.isMongoId(id.toString()) || !options_data || typeof options_data != 'object' || !filters_data || typeof filters_data != 'object')
    return callback('bad_request');

  const filters = {};
  const options = {
    limit: ((!options_data.limit || !Number.isInteger(options_data.limit)) ? 100 : options_data.limit),
    skip: (!options_data.skip || !Number.isInteger(options_data.skip) ? 0 : options_data.skip)
  };

  if (filters_data.name && typeof filters_data.name == 'string')
    filters.name = { $text: {
      $search: filters_data.name
    } };

  const User = this;

  User.findById(mongoose.Types.ObjectId(id.toString()), (err, user) => {
    if (err || !user) return callback('document_not_found');

    filters._id = { $in: user.chats };

    User
      .find(filters)
      .sort({ name: -1 })
      .skip( options.skip * options.limit )
      .limit( options.limit )
      .then(users => {
        async.times(
          users.length,
          (time, next) => getUser(users[time], (err, user) => next(err, user)),
          (err, users) => {
            if (err) return callback(err);

            return callback(null, users);
          }
        );
      })
      .catch(err => callback(err));
  });
};

UserSchema.statics.pushUserToChats = function (id, user_id, callback) {
  // Find the user with the given id and push the user_id to its chats array
  // Return an error if it exists

  if (!id || !validator.isMongoId(id.toString()) || !user_id || !validator.isMongoId(user_id.toString()))
    return callback('bad_request');

  const User = this;

  User.findOneAndUpdate({
    _id: mongoose.Types.ObjectId(id),
    chats: {$ne: mongoose.Types.ObjectId(user_id)}
  }, {$push: {
    chats: mongoose.Types.ObjectId(user_id.toString())
  }}, err => {
    if (err) return callback('database_error');

    return callback(null);
  });
};

module.exports = mongoose.model('User', UserSchema);
