
function editProfile(req, res) {
  const email = req.params.userId;
  const user = userExists(email)

  if(user) {
    res.status(200).json({
      message: 'Successful edit',
      user
    });
  } else {
    res.status(404).json({
      message: 'User not found'
    })
  }
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

module.exports = { editProfile };
