// This controller will be used for handling the bulk data and processing also storing it into db

const BigPromise = require("../middlewares/BigPromise");
const logger = require("logat");
const { _doesProjectIdAndApiKeyMatches, _getProjectById } = require("../utils/project.utils");
const { _doesThisApiAlreadyExists, _isApiDown, _getAPIUsingId, _createApiModelAndSaveInDb, _updateApiModelAndSaveInDb, _updateApiModelUsingId, _findApiUsingProjectKeyAndPath } = require("../utils/apiModel.utils");
const CustomError = require("../utils/customError");
const { _isRadarExists, _addRadarOnApi, _updateRadar, _generateApiHitsReport, _deleteRadarFromApi, _bulkUpdateRadar, _setMonitoringOnCache } = require("../utils/radar.utils");
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
    if (apiObj?.isRadarEnabled === false) {
        logger.info(`INFO || Radar is Disabled for this API... returning`);
        // move this to redis in next iteration
        res.status(201).json({
            message: "monitoring isn't enabled for this api yet",
            path: apiObj?.apiEndPoint,
            method: apiObj?.apiMethod,
            apiId: apiObj?._id
        })
        return;
    }

    if (!apiObj) {
        logger.info(`INFO || API Hit came for the first Time... for projectId : ${projectId}`);
        apiObj = await _createApiModelAndSaveInDb(project, apiLogInfo);
        // If the API is down, notify the team
        if (_isApiDown(apiLogInfo.statusCode)) {
            logger.info(`INFO || API : ${apiObj._id} is down, sending out emails to relevant persons in the project`);
            sendAlert(apiObj,apiLogInfo);
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
        await _setMonitoringOnCache(false,apiObj._id.toString());

        return res.status(200).json({
            message: "API saved successfully for the first time",
            apiObj
        });

    } else {
        let isRadarPresentForApi = await _isRadarExists(apiObj._id);

        if (!isRadarPresentForApi) {
            logger.info(`INFO || Initiating radar for this api with id : ${apiObj._id}`);
            await _addRadarOnApi(apiLogInfo, apiObj);
            await _setMonitoringOnCache(false,apiObj._id.toString());
        } else {
            await _updateRadar(isRadarPresentForApi, apiLogInfo);
        }


        if (_isApiDown(apiLogInfo.statusCode)) {
            logger.info(`INFO || API : ${apiObj._id} is down sending out emails to related person in project`);
            sendAlert(apiObj,apiLogInfo);
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
    if(!reqType || !apiId){
        logger.error(`Error || Missing mandatory fields while configuring the radar`);
        return res.status(422).json({
            message: "Mandatory Fields are missing",
            success: false
        }) 
    }

    await _updateApiModelUsingId(apiId, { "isRadarEnabled": reqType === 'ADD' ? true : false });
    await _setMonitoringOnCache(reqType === 'ADD' ? true : false,apiId);

    res.status(200).json({
        message: `Radar is ${reqType === 'ADD' ? 'Enabled' : 'Disabled'} for API`,
        success: true
    })
})

exports.bulkProcessFromCaching = BigPromise(async (req, res, next) => {
    logger.info(`INFO || Bulk Processing from Caching is being initiated at : ${new Date().toISOString()}`);

    const {bulkData}  = req.body;

    // traverse through the bulkData and process it further (bulkData is an object)
    // Add validation and logging
    if (!bulkData || Object.keys(bulkData).length === 0) {
        logger.error('ERROR || Bulk data is empty or undefined');
        return res.status(400).json({
            statusCode: 400,
            message: "Invalid or empty bulk data received"
        });
    }

    // Log the received data structure
    logger.info(`INFO || Received bulk data with ${Object.keys(bulkData).length} API paths`);
    try {
        await Promise.all(
            Object.entries(bulkData).map(async ([apiPath, apiData]) => {
                await _bulkUpdateRadar(apiPath, apiData.apiLogs, apiData.hits);
                logger.info(`INFO || Bulk Data Successfully updated for API path: ${apiPath}`);
            })
        );

        return res.status(200).json({
            statusCode: 200,
            message: "Bulk Data Updated Successfully"
        });
    } catch (error) {
        logger.error(`ERROR || Bulk processing failed: ${error.message}`);
        return res.status(500).json({
            statusCode: 500,
            message: "Bulk Processing Failed",
            error: error.message
        });
    }
})