const db = require("../models/index.js");
const Users = db.users;

function editProfile(req, res) {
  const email = req.params.userId;
  const user = Users.getOneUser(email);

  if(user) {
    Users.update(req.body, { where: { email: email }})
      .then(
        res.status(200).json({
          message: 'Successful edit'
        }));
  } else {
    res.status(404).json({
      message: 'User not found'
    })
  }
}

module.exports = { editProfile };
