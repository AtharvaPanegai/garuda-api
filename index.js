const app = require("./app");
const connectDb = require("./config/dbConfig");
require('dotenv').config();
const logger = require("logat")

// connecting DB here
connectDb();

app.listen(process.env.PORT,()=>{
    logger.info(`INFO || api-radar-api is up and running at http://localhost:${process.env.PORT}`);

})
