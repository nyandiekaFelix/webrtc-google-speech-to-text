const db = require("../models/index.js");
const Users = db.users;

async function createUser(req, res) {

  const validfields = (data) => {
    return Object.keys(data)
      .every(
        key => (data[key] !== '' && data[key] !== undefined)
      )
  };

  if(!validfields(req.body)) {
    res.status(500).json({
      message: 'Please fill all required fields'
    });
  }

  const userExists = await Users.getOneUser(req.body.email);

  if(!userExists) {
    Users.addUser(req.body)
      .then(
        res.status(200).json({
          message: 'User registered successfully',
      }));
  } else {
    res.status(409).json({
      message: 'A user with that email already exists'
    })
  }
}

function getUsers(req, res) {
  Users.getAllUsers()
    .then(users => {
      res.status(200).json({
        users
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "An error occurred while fetching users."
      });
    });
}

function deleteUser(req, res) {
  const email = req.params.userId;

  const user = Users.getOneUser(email)

  if(user) {
    Users.deleteUser(email)
      .then(
        res.status(200).json({
          message: 'User deleted successfully',
          users
      }))
      .catch(err => {
        res.status(500).json({
          message: 'An error occured while deleting user'
        })
      })
  } else {
    res.status(404).json({
      message: 'User not found'
    })
  }
}

module.exports = { getUsers, deleteUser, createUser };
