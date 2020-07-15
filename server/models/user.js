const bcrypt = require('bcrypt');

const db = require("../models/index.js");
const Users = db.users;


module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    username: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING
    },
    password: {
      type: Sequelize.STRING
    },
    profileImage: {
      type: Sequelize.STRING
    }
  });

  // hash password before save
  User.beforeCreate(async (user, options) => {
    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);  
  });

  User.getAllUsers = async function() {
    return await this.findAll();
  };

  User.getOneUser = async function(id) {
    return await this.findOne({ where: { email: id }});
  };

  User.addUser = async function(data) {
    const newUser = await this.create(data);
    return newUser;
  };

  User.deleteUser = async function(id) {
    return await this.destroy({ where: { email: id }});
  };

  User.validPassword = async function(plainTextPassword, hashedPassword) {
    let isValid;
    bcrypt.compare(plainTextPassword, hashedPassword, function(err, result) {
      isValid = result;
    });
    return isValid;
  }

  return User;
};
