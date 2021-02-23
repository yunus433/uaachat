// Format the given message using given message and timezone

const moment = require('moment-timezone');

module.exports = (data, callback) => {
  if (!data || typeof data != 'object' || !data.message || !Number.isInteger(data.timezone))
    return callback('bad_request');

  data.timezone = 0;

  return callback(null, {
    _id: data.message._id.toString(),
    type: data.message.type,
    content: data.message.content,
    sender_id: data.message.sender_id.toString(),
    chat_id: data.message.chat_id.toString(),
    read_by: data.message.read_by.map(id => id.toString()),
    time: moment(data.message.created_at + (data.timezone * 60 * 1000)).format("HH[:]mm"),
    day: moment(data.message.created_at + (data.timezone * 60 * 1000)).format("DD[.]MM[.]YYYY"),
    days_ago: parseInt(moment().tz('Etc/GMT0').format("DD")) - parseInt(moment(data.message.created_at + (data.timezone * 60 * 1000)).format("DD"))
  });
}
