const jwt = require('jsonwebtoken');

const db = require("../models/index.js");
const Users = db.users;

function generateJWT(userId) {
  return jwt.sign(
    userId, 
    process.env.JWT_SECRET_KEY, 
    //{ expiresIn: null } // expiry time should ideally be set for security, Value given should be in seconds
  );
}

async function login(req, res) {
  
  const { email, password } = req.body;
  const user = await Users.getOneUser(email);

  if(user) {
    const isPasswordValid = Users.validPassword(password, user.password);
    
    if(!isPasswordValid) {
      res.status(401).json({
        message: 'Password is incorrect'
      });
    }
    
    const { id, username, email, profileImage } = user;
    res.status(200).json({
      token: `${generateJWT(user.email)}`,
      user: { 
        id, username, email, profileImage
      }
    });
  } else {
    res.status(404).json({
      message: 'User not found'
    })
  }

}

module.exports = { login };
