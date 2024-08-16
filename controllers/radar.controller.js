// This controller will be used for handling the bulk data and processing also storing it into db

const BigPromise = require("../middlewares/BigPromise");
const logger = require("logat");
const { _doesThisCustomerExists } = require("../utils/user.utils");
const { _doesThisKeyBelongsToCustomerAndProject, _getProjectUsingCustomerIdAndApiKey } = require("../utils/project.utils");
const { _doesThisApiAlreadyExists, _isApiDown, _findApiUsingProjectKeyAndPath, _updateApiModelUsingId, _getAverageResponseTime, _getMostCapturedStatusCode } = require("../utils/radar.utils");
const apiModel = require("../models/apiModel");

exports.onboardApisAsPerHits = BigPromise(async (req, res, next) => {

    let { userId } = req.body;
    let apiKey = req.headers.apikey;
    let apiLogInfo = req.body;

    // Early Returns and validations
    if (!userId || !apiKey || !apiLogInfo) {
        res.status(400).json({
            statusCode: 400,
            message: "Bad Request! , Check Missing fields between userId, apikey and apiLogInfo"
        })

        return;
    }
    if (userId) {
        let isCustomerThere = await _doesThisCustomerExists(userId)
        if (!isCustomerThere) {
            logger.error(`Error || Customer with userId : ${userId} does not exist`);
            res.status(404).json({
                statusCode: 404,
                message: "Customer not found!"
            })
            return;
        }
        let checkcustomerandproject = await _doesThisKeyBelongsToCustomerAndProject(userId, apiKey);
        if (!checkcustomerandproject) {
            logger.error(`Error || Provided ApiKey does not match with the apiKey of customer : ${userId}`);
            res.status(403).json({
                statusCode: 403,
                message: "Invalid Api Key!"
            })
            return;
        }
        logger.info(`INFO || Provided Api Key matches with userId : ${userId} ... proceeding further`);
    }

    // Actual Processing of Apis    
    logger.info(`INFO || Processing the api Data for user : ${userId}`);

    let project = await _getProjectUsingCustomerIdAndApiKey(userId, apiKey);
    let doesApiExists = await _doesThisApiAlreadyExists(apiLogInfo.method, apiLogInfo.path, userId, project._id);
    if (doesApiExists) {
        // if api already exists
        // update the apiMostRecentStatusCode,apiMostRecentResponseTime,apiAverageResponseTime , apiMostCapturedStatusCode
        // update if the api is down

        let apiObj = await _findApiUsingProjectKeyAndPath(project._id, apiLogInfo.path);
        let statusCodeArray = apiObj.apiStatusCodesArray;
        statusCodeArray.push(apiLogInfo.statusCode)
        let mostCapturedStatusCode = _getMostCapturedStatusCode(statusCodeArray);
        let averageResponseTime = _getAverageResponseTime(apiLogInfo.responseTime,apiObj);

        if (_isApiDown(apiLogInfo.statusCode)) {
            logger.info(`INFO || API : ${apiObj._id} is down sending out emails to realted person in project`);
        }

        let updateObj = {
            "apiMostRecentStatusCode" : apiLogInfo.statusCode,
            "apiMostRecentResponseTime" : apiLogInfo.responseTime,
            "apiMostCapturedStatusCode" : mostCapturedStatusCode,
            "apiAverageResponseTime" : averageResponseTime,
            "totalHitsTillNow" : apiObj.totalHitsTillNow + 1,
            "apiStatusCodesArray" : statusCodeArray,
            "isCurrentlyDown": _isApiDown(apiLogInfo.statusCode),
        }

        await _updateApiModelUsingId(apiObj._id,updateObj);
        
        res.status(200).json({
            message : "API Info Updated successfully"
        })
        return;

    } else {
        logger.info(`INFO || This API for user : ${userId} came for the first time saving into db`);

        let apiObj = await apiModel.create({
            apiEndPoint: project._id + apiLogInfo.path,
            apiMethod: apiLogInfo.method,
            apiMostCapturedStatusCode: apiLogInfo.statusCode,
            apiAverageResponseTime: apiLogInfo.responseTime,
            project: project._id,
            customer: userId,
            isCurrentlyDown: _isApiDown(apiLogInfo.statusCode),
            apiMostRecentStatusCode: apiLogInfo.statusCode,
            apiMostRecentResponseTime: apiLogInfo.responseTime,
            totalHitsTillNow: 1,
            apiStatusCodesArray: [apiLogInfo.statusCode]
        })

        if (_isApiDown(apiLogInfo.statusCode)) {
            logger.info(`INFO || API : ${apiObj._id} is down sending out emails to realted person in project`);
        }

        logger.info(`INFO || New Api Saved for user : ${userId} with id : ${apiObj._id}`);

        res.status(200).json({
            message: "API saved successfully for the first time",
            apiObj
        })

    }

})

