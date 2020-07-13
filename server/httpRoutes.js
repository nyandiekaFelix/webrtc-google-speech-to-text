const express = require('express');

const { loginController } = require('./controllers/auth.js');
const usersController = require('./controllers/users.js');

module.exports = function initializeRoutes(app) {
  const Router = express.Router();
  // Router.use(authentication)

  const login = Router.post('/login', loginController)

  const userAdmin = Router.get(
    '/useradmin', 
    (req, res) => { res.json({ message: 'Useradmin' }) 
  })

  const profile = Router.get(
    '/profile', 
    (req, res) => { res.json({ message: 'Profile' }) 
  })

  app.use('/user', Router)
}
