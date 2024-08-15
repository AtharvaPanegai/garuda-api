// This controller will be used for handling the bulk data and processing also storing it into db

const BigPromise = require("../middlewares/BigPromise");
const logger = require("logat");
const { _doesThisCustomerExists } = require("../utils/user.utils");
const { _doesThisKeyBelongsToCustomerAndProject } = require("../utils/project.utils");



exports.onboardApisAsPerHits = BigPromise(async (req, res, next) => {

    const customerId = req.params.customerId;
    const apiKey = req.headers.apiKey;
    const { apiLogInfo } = req.body;

    // Early Returns and validations
    if (!customerId || !apiKey || !apiLogInfo) {
        res.status(400).json({
            statusCode: 400,
            message: "Bad Request! , Check Missing fields between customerId, apikey and apiLogInfo"
        })
    }
    if (customerId) {
        if (!_doesThisCustomerExists(customerId)) {
            logger.error(`Error || Customer with customerId : ${customerId} does not exist`);
            res.status(404).json({
                statusCode: 404,
                message: "Customer not found!"
            })
        }
        if (!_doesThisKeyBelongsToCustomerAndProject(customerId, apiKey)) {
            logger.error(`Error || Provided ApiKey does not match with the apiKey of customer : ${customerId}`);
            res.status(403).json({
                statusCode: 403,
                message: "Invalid Api Key!"
            })
        }
        logger.info(`INFO || Provided Api Key matches with customerId : ${customerId} ... proceeding further`);
    }

    // Actual Processing of Apis

    logger.info(`INFO || Onboarding bulk apis from customer ${customerId}`);
})