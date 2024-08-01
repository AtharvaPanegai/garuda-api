const mongoose = require("mongoose");
const logger = require("logat");

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECTION_STRING);
        logger.info("INFO || Connected to DB successfully...");
    } catch (err) {
        logger.error("PANIC || Error || Error in connecting to DB....");
        logger.error(err);
    }
};

module.exports = connectDb;
