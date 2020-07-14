// ROLES = ['administrator', 'standard'];

const users = [
  {
    username: 'admin',
    email: 'admin@mail.com',
    password: 'password',
    role: 'administrator'
  }
];

function userExists(email) {
  const [user] = users.filter(usr => usr.email === email);

  return user;
}

function createUser(req, res) {
  
  const { email, password, username } = req.body;

  const user = {};

  if(!userExists(email)) {
    res.status(200).json({
      message: 'User registered successfully',
      users
    });
  } else {
    res.status(409).json({
      message: 'A user with that email already exists'
    })
  }
}

function getUsers(req, res) {
  if(users.length) {
    res.status(200).json({
      users
    });
  } else {
    res.status(404).json({
      message: 'No records available'
    })
  }
}

function deleteUser(req, res) {
  const email = req.params.email;
  const user = userExists(email)

  if(user) {
    res.status(200).json({
      message: 'User deleted successfully',
      users
    });
  } else {
    res.status(404).json({
      message: 'User not found'
    })
  }
}

module.exports = { getUsers, deleteUser, createUser };
