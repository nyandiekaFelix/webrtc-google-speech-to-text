const { Nuxt, Builder } = require("nuxt");
const bodyParser = require('body-parser');
const logger = require('morgan');
const cors = require('cors');


const app = require("express")();
const port = process.env.PORT || 5000;

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

