// Returns the user object for client side

module.exports = (user, callback) => {
  if (!user || !user._id)
    return callback('bad_request');

  return callback(null, {
    _id: user._id.toString(),
    is_teacher: user.is_teacher,
    is_confirmed: user.is_confirmed,
    email: user.email,
    completed: user.completed,
    name: user.name,
    details: user.details,
    profile_photo: user.profile_photo,
    chat_number: user.chats.length
  });
}
