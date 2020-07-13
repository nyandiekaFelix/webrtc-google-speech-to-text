const passportJWT = require('passport-jwt');
//const User = require('../models/user.js');

const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;

function userExists(user) {
  const users = [
    {
      username: 'admin',
      email: 'admin@mail.com',
      password: 'password'
    }
  ];
}

const jwtStrategy = new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET_KEY || '__secret__' // The RISKY hardcoded string is just for testing purposes
  }, 
  (jwtPayload, done) => {
    process.nextTick(_ => {
      const userAttributes = {
        email: jwtPayload.email
      }
      userExists(userAttributes)
        .then(user => {
          if (!user) return done(null, false)
          return done(null, user)
        })
        .catch(error => {
          return done(error)
        })
    })
  })

module.exports = jwtStrategy
