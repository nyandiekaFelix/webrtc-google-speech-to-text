const { Nuxt, Builder } = require("nuxt");
const bodyParser = require('body-parser');
const logger = require('morgan');
const cors = require('cors');

const db = require('./models/index.js');
db.sequelize.sync();

const app = require("express")();

const socket = require('./socket.js');
socket(app);

app.use(logger('dev'));

app.use(cors());

// Handle POST request data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const initializeRoutes = require('./httpRoutes.js')(app);

const config = require("../nuxt.config.js");

config.dev = !(process.env.NODE_ENV === 'production');

module.exports = {
  path: '/api',
  handler: app
};

