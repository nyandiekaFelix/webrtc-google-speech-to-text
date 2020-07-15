const Sequelize = require('sequelize');
const userModel = require('./user.js');

const { 
  dbName, host, port, dialect, password, user, pool: { max, min, acquire, idle }
} = require("../config/sequelize.js");

const sequelize = new Sequelize(dbName, user, password, {
  host,
  dialect,
  pool: { max, min, acquire, idle }
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = userModel(sequelize, Sequelize);

module.exports = db;
