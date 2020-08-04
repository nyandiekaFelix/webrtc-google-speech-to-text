const passportJWT = require('passport-jwt');
const User = require('../models/user.js');

const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;

const jwtStrategy = new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET_KEY
  }, 
  (jwtPayload, done) => {
    process.nextTick(_ => {
      User.getOneUser(jwtPayload.email)
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
