// This controller will be used for handling the bulk data and processing also storing it into db

const BigPromise = require("../middlewares/BigPromise");
const logger = require("logat");
const { _doesThisCustomerExists } = require("../utils/user.utils");
const { _getProjectUsingCustomerIdAndApiKey, _doesThisProjectExists, _doesProjectIdAndApiKeyMatches, _getProjectById } = require("../utils/project.utils");
const { _doesThisApiAlreadyExists, _isApiDown, _findApiUsingProjectKeyAndPath, _updateApiModelUsingId, _getAverageResponseTime, _getMostCapturedStatusCode, _getAPIUsingId  } = require("../utils/radar.utils");
const apiModel = require("../models/apiModel");
const CustomError = require("../utils/customError");
const { _isApiPerformaceModelExists, _createApiPerformaceModel, _updatePerformance, _getCreationObject, _getUpdationObject } = require("../utils/apiPerformace.utils");
// const { checkApiInCache, saveApiInCache } = require("../services/redis.service");


exports.onboardApisAsPerHits = BigPromise(async (req, res, next) => {
    let { projectId } = req.body;
    let apiKey = req.headers.apikey;
    let apiLogInfo = req.body;

    if (!projectId || !apiKey || !apiLogInfo) {
        logger.error(`Error || Mandartoy fields missing`);
        return res.status(422).json({
            statusCode: 422,
            message: "Mandatory fields are missing!"
        })
    }

    let project = await _getProjectById(projectId);
    if (!project) {
        logger.error(`Error || Project with given projectId : ${projectId} does not exist`);
        return res.status(404).json({
            statusCode: 404,
            message: "Project with given projectId Does not exist!"
        })
    }

    logger.info(`INFO || Project exists and all the mandatory inputs are also present... proceeding further`);

    let doesApiKeyAndProjectIdMatches = await _doesProjectIdAndApiKeyMatches(projectId, apiKey);

    if (!doesApiKeyAndProjectIdMatches) {
        logger.error(`Error || ProjectId and Api Key mimatched for projectId : ${projectId}`);
        // probably trigger email from here to end user saying if the projectId is leaked 
        return res.status(401).json({
            statusCode: 401,
            message: "Invalid API Key!"
        })
    }

    logger.info(`INFO || Project Exists and API key also matched with project Id : ${projectId} ... proceeding further`);

    let apiObj = await _doesThisApiAlreadyExists(apiLogInfo.method, apiLogInfo.path, project._id);
    if (!apiObj) {
        logger.info(`INFO || API Hit came for the first Time... for projectId : ${projectId}`);
        apiObj = await apiModel.create({
            apiEndPoint: project._id + apiLogInfo.path,
            apiMethod: apiLogInfo.method,
            apiMostCapturedStatusCode: apiLogInfo.statusCode,
            apiAverageResponseTime: apiLogInfo.responseTime,
            project: project._id,
            customer: project.customer,
            isCurrentlyDown: _isApiDown(apiLogInfo.statusCode),
            apiMostRecentStatusCode: apiLogInfo.statusCode,
            apiMostRecentResponseTime: apiLogInfo.responseTime,
            totalHitsTillNow: 1,
            apiStatusCodesArray: [apiLogInfo.statusCode],
        });

        // If the API is down, notify the team
        if (_isApiDown(apiLogInfo.statusCode)) {
            logger.info(`INFO || API : ${apiObj._id} is down, sending out emails to relevant persons in the project`);
        }

        logger.info(`INFO || New API saved for Project : ${projectId} with id : ${apiObj._id}`);

        // Create a new entry in apiPerformanceModel for performance metrics
        let creationObject = await _getCreationObject(apiLogInfo,apiObj._id);
        await _createApiPerformaceModel(creationObject);

        return res.status(200).json({
            message: "API saved successfully for the first time",
            apiObj,
        });

    } else {
        let isRadarPresentForApi = await _isApiPerformaceModelExists(apiObj._id);

        if (!isRadarPresentForApi) {
            logger.info(`INFO || Initiating radar for this api with id : ${apiObj._id}`);
            let creationObject = _getCreationObject(apiLogInfo,apiObj._id);
            let performaceRadar = await _createApiPerformaceModel(creationObject);
        } else {
            let updateObject = _getUpdationObject(apiLogInfo,isRadarPresentForApi);
            await _updatePerformance(isRadarPresentForApi._id, updateObject);
        }

        //  Update the existing API record
        let statusCodeArray = apiObj.apiStatusCodesArray;
        statusCodeArray.push(apiLogInfo.statusCode);
        let mostCapturedStatusCode = _getMostCapturedStatusCode(statusCodeArray);
        let averageResponseTime = _getAverageResponseTime(apiLogInfo.responseTime, apiObj);

        if (_isApiDown(apiLogInfo.statusCode)) {
            logger.info(`INFO || API : ${apiObj._id} is down, sending emails to relevant persons in the project`);
        }

        // Update the apiModel
        let updateObj = {
            "apiMostRecentStatusCode": apiLogInfo.statusCode,
            "apiMostRecentResponseTime": apiLogInfo.responseTime,
            "apiMostCapturedStatusCode": mostCapturedStatusCode,
            "apiAverageResponseTime": averageResponseTime,
            "totalHitsTillNow": apiObj.totalHitsTillNow + 1,
            "apiStatusCodesArray": statusCodeArray,
            "isCurrentlyDown": _isApiDown(apiLogInfo.statusCode),
        };

        await _updateApiModelUsingId(apiObj._id, updateObj);

        return res.status(200).json({
            statusCode: 200,
            message: "Hit Recorded!"
        })
    }
})




exports.getReportOfSingleApi = BigPromise(async (req, res, next) => {
    const { apiId, projectId } = req.body;

    if (!apiId || !projectId) {
        logger.error(`Error || Either one of apiId or project id is missing`);
        throw new CustomError("Mandatory Feilds between apiId or projectId is missing", 400);
    }

    let apiDoc = await _getAPIUsingId(apiId);

    if (!apiDoc || !apiDoc.project == projectId) {
        logger.error(`Error || Error in finding the apiDoc with apiId : ${apiId} and project : ${projectId}`);
        throw new CustomError(`API Doc with this project Id does not exist`, 404);
    }



})