const express = require('express');

const { login } = require('./controllers/auth.js');
const { editProfile } = require('./controllers/profile.js');
const { getUsers, deleteUser, createUser } = require('./controllers/users.js');

module.exports = function initializeRoutes(app) {

  // Auth
  const authRouter = express.Router();

  authRouter.post('/login', login);

  app.use('/auth', authRouter);

  // User admin
  const userAdminRouter = express.Router();

  userAdminRouter.post('/users', createUser);
  userAdminRouter.get('/users', getUsers);
  userAdminRouter.delete('/:userId', deleteUser);

  app.use('/useradmin', userAdminRouter);

  // Profile
  const profileRouter = express.Router();

  profileRouter.put('/:userId', editProfile);

  app.use('/profile', profileRouter);
}
