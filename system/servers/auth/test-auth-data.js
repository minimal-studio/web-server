const users = [
  'alex', 'joyy', 'kiven', 'fred', 'erica', 'alan', 'matt', 'jeremy',
  'Ricardo'
];

let userAuth = {
  admin: {
    password: '1234@qwer'
  }
};

for (const user of users) {
  userAuth[user] = {
    password: 'qwe123'
  };
}

module.exports = userAuth;