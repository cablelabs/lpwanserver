function validationFail (c, _, res) {
  return res.status(400).json({ status: 400, err: c.validation.errors })
}

module.exports = {
  validationFail,
  ...require('./application'),
  ...require('./application-ntl'),
  ...require('./device'),
  ...require('./device-ntl'),
  ...require('./device-profile'),
  ...require('./network'),
  ...require('./network-protocol'),
  ...require('./network-provider'),
  ...require('./network-type'),
  ...require('./reporting-protocol'),
  ...require('./session'),
  ...require('./user')
}
