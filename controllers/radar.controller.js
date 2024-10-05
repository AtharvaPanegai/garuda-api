// This controller will be used for handling the bulk data and processing also storing it into db

const BigPromise = require("../middlewares/BigPromise");
const logger = require("logat");
const { _doesProjectIdAndApiKeyMatches, _getProjectById } = require("../utils/project.utils");
const { _doesThisApiAlreadyExists, _isApiDown, _getAPIUsingId, _createApiModelAndSaveInDb, _updateApiModelAndSaveInDb } = require("../utils/apiModel.utils");
const CustomError = require("../utils/customError");
const { _isRadarExists, _addRadarOnApi, _updateRadar } = require("../utils/radar.utils");
// const { checkApiInCache, saveApiInCache } = require("../services/redis.service");


// This is main API where all the hits from package will get processed further old and new both
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
        apiObj = await _createApiModelAndSaveInDb(project, apiLogInfo);
        // If the API is down, notify the team
        if (_isApiDown(apiLogInfo.statusCode)) {
            logger.info(`INFO || API : ${apiObj._id} is down, sending out emails to relevant persons in the project`);
        }
        let checkapiKeyAndProjectId = await _doesProjectIdAndApiKeyMatches(projectId, apiKey);
        if (!checkapiKeyAndProjectId) {
            logger.error(`Error || Provided ApiKey does not match with the apiKey of project : ${projectId}`);
            res.status(403).json({
                statusCode: 403,
                message: "Invalid Api Key!"
            })
            return;
        }
        logger.info(`INFO || Provided Api Key matches with Project : ${projectId} ... proceeding further`);


        logger.info(`INFO || New API saved for Project : ${projectId} with id : ${apiObj._id}`);

        // Create a new entry in apiPerformanceModel for performance metrics

        await _addRadarOnApi(apiLogInfo, apiObj._id);

        return res.status(200).json({
            message: "API saved successfully for the first time",
            apiObj
        });

    } else {
        let isRadarPresentForApi = await _isRadarExists(apiObj._id);

        if (!isRadarPresentForApi) {
            logger.info(`INFO || Initiating radar for this api with id : ${apiObj._id}`);
            await _addRadarOnApi(apiLogInfo, apiObj._id);
        } else {
            await _updateRadar(isRadarPresentForApi,apiLogInfo);
        }


        if (_isApiDown(apiLogInfo.statusCode)) {
            logger.info(`INFO || API : ${apiObj._id} is down sending out emails to realted person in project`);
        }

        await _updateApiModelAndSaveInDb(apiObj, apiLogInfo);

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