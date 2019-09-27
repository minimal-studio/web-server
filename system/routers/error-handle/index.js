// var nodemailer = require('nodemailer')
// var transport = nodemailer.createTransport('SMTP', { // [1]
//   service: "Gmail",
//   auth: {
//     user: "gmail.user@gmail.com",
//     pass: "userpass"
//   }
// })

// if (process.env.NODE_ENV === 'production') { // [2]
//   process.on('uncaughtException', function (er) {
//     console.error(er.stack) // [3]
//     transport.sendMail({
//       from: 'alerts@mycompany.com',
//       to: 'alert@mycompany.com',
//       subject: er.message,
//       text: er.stack // [4]
//     }, function (er) {
//        if (er) console.error(er)
//        process.exit(1) // [5]
//     })
//   })
// }

let notFount = require("../notfound");

let handleError = (err, req, res, next) => {
  console.log(err);
  if(err) {
    return notFount(req, res);
  } else {
    return res.status(404).send("Sorry can't find that!");
  }
};

module.exports = handleError;
