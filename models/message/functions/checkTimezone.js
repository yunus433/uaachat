// Checks if the given timezone is a valid value returned by getTimezoneOffset function on client side

module.exports = timezone => {
  if (isNaN(parseInt(timezone)))
    return false;
  timezone = parseInt(timezone);
  return (Number.isInteger(timezone) && Math.abs(timezone) < 720 && Math.abs(timezone) % 60 == 0)
}
