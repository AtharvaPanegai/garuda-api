const app = require("./app");
const serverless = require("serverless-http");
const connectDb = require("./config/dbConfig");
const logger = require("logat");
require('dotenv').config();

// Connecting to the database
connectDb();

// Wrapping the app with serverless-http
module.exports.handler = serverless(app);

logger.info(`INFO || Lambda handler is ready to process requests.`);
