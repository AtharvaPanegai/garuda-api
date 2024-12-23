// This controller will be used for handling the bulk data and processing also storing it into db

const BigPromise = require("../middlewares/BigPromise");
const logger = require("logat");
const { _doesProjectIdAndApiKeyMatches, _getProjectById } = require("../utils/project.utils");
const { _doesThisApiAlreadyExists, _isApiDown, _getAPIUsingId, _createApiModelAndSaveInDb, _updateApiModelAndSaveInDb, _updateApiModelUsingId } = require("../utils/apiModel.utils");
const CustomError = require("../utils/customError");
const { _isRadarExists, _addRadarOnApi, _updateRadar, _generateApiHitsReport, _deleteRadarFromApi } = require("../utils/radar.utils");
const { sendAlert } = require("../services/alert.service");
const { _reportIncident } = require("../utils/incident.utils");
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
    if (apiObj?.isRadarEnabled) {
        logger.info(`INFO || Radar is Disabled for this API... returning`);
        // move this to redis in next iteration
        res.status(201).json({
            message: "monitoring isn't enabled for this api yet",
            path: apiObj.apiEndPoint,
            method: apiObj.apiMethod,
            apiId: apiObj._id
        })
        return;
    }

    if (!apiObj) {
        logger.info(`INFO || API Hit came for the first Time... for projectId : ${projectId}`);
        apiObj = await _createApiModelAndSaveInDb(project, apiLogInfo);
        // If the API is down, notify the team
        if (_isApiDown(apiLogInfo.statusCode)) {
            logger.info(`INFO || API : ${apiObj._id} is down, sending out emails to relevant persons in the project`);
            sendAlert(apiObj);
            _reportIncident(apiObj, apiLogInfo);

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

        await _addRadarOnApi(apiLogInfo, apiObj);

        return res.status(200).json({
            message: "API saved successfully for the first time",
            apiObj
        });

    } else {
        let isRadarPresentForApi = await _isRadarExists(apiObj._id);

        if (!isRadarPresentForApi) {
            logger.info(`INFO || Initiating radar for this api with id : ${apiObj._id}`);
            await _addRadarOnApi(apiLogInfo, apiObj);
        } else {
            await _updateRadar(isRadarPresentForApi, apiLogInfo);
        }


        if (_isApiDown(apiLogInfo.statusCode)) {
            logger.info(`INFO || API : ${apiObj._id} is down sending out emails to realted person in project`);
            sendAlert(apiObj);
            _reportIncident(apiObj, apiLogInfo);
        }

        await _updateApiModelAndSaveInDb(apiObj, apiLogInfo);

        return res.status(200).json({
            statusCode: 200,
            message: "Hit Recorded!"
        })
    }
})




exports.getReportOfSingleApi = BigPromise(async (req, res, next) => {
    const { apiId, projectId, duration } = req.body;

    if (!apiId || !projectId) {
        logger.error(`Error || Either one of apiId or project id is missing`);
        throw new CustomError("Mandatory Feilds between apiId or projectId is missing", 400);
    }

    let apiDoc = await _getAPIUsingId(apiId);

    if (!apiDoc || !apiDoc.project.toString() == projectId) {
        logger.error(`Error || Error in finding the apiDoc with apiId : ${apiId} and project : ${projectId}`);
        throw new CustomError(`API Doc with this project Id does not exist`, 404);
    }

    let radarObj = await _isRadarExists(apiDoc._id);

    if (!radarObj) {
        logger.error(`Error || Radar Object Not found for this API with Id : ${apiDoc._id}`);
        throw new CustomError("Radar Missing For this API Contact Support Team", 500);
    }

    let apiReport = _generateApiHitsReport(radarObj, duration);

    // Adding radar object for rendering other crucial information such as the Avg statusCode avg response time etc
    res.status(200).json({
        message: "Report generated for given time duration",
        apiReport,
        radarObj
    })

})


exports.enableOrDisableRadarOnApi = BigPromise(async (req, res, next) => {
    const { reqType, apiId } = req.body;
    if (reqType === 'ADD') {

        await _updateApiModelUsingId(apiId, { "isRadarEnabled": true });
        res.status(200).json({
            message: "Radar is Enabled for API",
            success: true
        });
    } else if (reqType === 'REMOVE') {
        logger.info(`INFO || Radar is being enabled for api : ${apiId}`);
        await _deleteRadarFromApi(apiId)
        await _updateApiModelUsingId(apiId, { "isRadarEnabled": false });

        res.status(200).json({
            message: "Radar disabled for this API",
            success: true
        })
    } else {
        let error = new CustomError("ReqType is expected!", 422);
        throw error;
    }
})