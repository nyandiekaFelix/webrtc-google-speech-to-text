const users = [
  {
    username: 'admin',
    email: 'admin@mail.com',
    password: 'password'
  }
];

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

function getUsers(req, res) {
  if(users.length) {
    res.status(200).json({
      token: `${generateJWT(user.email)}`,
      user
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
      message: 'User deleted successfully'
    });
  } else {
    res.status(404).json({
      message: 'User not found'
    })
  }
}

module.exports = { getUsers, deleteUser };
