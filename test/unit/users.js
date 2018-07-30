exports.getRoles = function () {
  return new Promise(function (resolve, reject) {
    resolve([{1: 'user'}, {2: 'admin'}])
  })
}

exports.emailVerifyInit = function () {

}
