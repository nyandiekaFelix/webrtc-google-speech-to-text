const jwt = require('jsonwebtoken');

const User = require('../models/user.js');

function generateJWT(user) {
  return jwt.sign(
    user, 
    process.env.SECRET_KEY || '__secret__', 
    //{ expiresIn: null } // expiry time should ideally be set for security, Value given should be in seconds
  );
}

function userExists(email) {
  const users = [
    {
      username: 'admin',
      email: 'admin@mail.com',
      password: 'password'
    }
  ];

  const [user] = users.filter(usr => usr.email === email);

  return user;
}

function login(req, res) {
  
  const email = req.body.email;
  const user = userExists(email)

  if(user) {
    res.status(200).json({
      token: `${generateJWT(user.email)}`,
      user
    });
  } else {
    res.status(404).json({
      message: 'User not found'
    })
  }

}

function signup(req, res) {
  
  const { email, password, username } = req.body;

  const user = {};

  if(!userExists(email)) {
    res.status(200).json({
      token: `${generateJWT(user.email)}`,
      user
    });
  } else {
    res.status(409).json({
      message: 'A user with that email already exists'
    })
  }

}


module.exports = { login, signup };
