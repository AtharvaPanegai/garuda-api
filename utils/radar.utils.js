const logger = require("logat");
const { _isObjectEmpty } = require("./global.utils");
const apiModel = require("../models/api.model");

exports._doesThisApiAlreadyExists = async (apiMethod, path, projectId) => {
    let apiPath = projectId + path;
    let apiObj = await apiModel.findOne({ apiEndPoint: apiPath, apiMethod: apiMethod, project: projectId });
    // this can be moved to redis for better functioning
    if (apiObj) {
        return apiObj;
    } else {
        return null;
    }
}


const _isApiDown = (apiStatusCode) => {
    if (apiStatusCode >= 200 && apiStatusCode < 400) {
        return false;
    } else {
        return true;
    }
};

exports._findApiUsingProjectKeyAndPath = async (projectId, path) => {
    let apiPath = projectId + path;
    let apiObj = await apiModel.findOne({ apiEndPoint: apiPath });
    return apiObj;
}


const _updateApiModelUsingId = async (apiId, updateObj) => {
    let updatedObject = await apiModel.updateOne({ _id: apiId }, updateObj);
    return updatedObject;
}

const _getAverageResponseTime = (newResponseTime, apiObj) => {
    let totalResponseTime = apiObj.totalHitsTillNow * apiObj.apiAverageResponseTime.replace(" ms", "")
    const numericResponseTime = parseFloat(newResponseTime.replace(" ms", ""));

    totalResponseTime += numericResponseTime;
    let totalApiHits = apiObj.totalHitsTillNow + 1;

    return (totalResponseTime / totalApiHits).toFixed(3) + ' ms';
};

const _getMostCapturedStatusCode = (statusCodesArray) => {
    const statusCodeCount = {};

    statusCodesArray.forEach(code => {
        statusCodeCount[code] = (statusCodeCount[code] || 0) + 1;
    });

    const mostCapturedStatusCode = Object.keys(statusCodeCount).reduce((a, b) =>
        statusCodeCount[a] > statusCodeCount[b] ? a : b
    );

    return parseInt(mostCapturedStatusCode);
};

exports._getAPIUsingId = async (apiId) => {
    let apiDoc;
    try {
        apiDoc = await apiModel.findById(apiId);
    } catch (err) {
        logger.error(`Error || Error in finding the api doc`);
        logger.error(err);
        throw err;
    }
}


exports._createApiModelAndSaveInDb = async (project, apiLogInfo) => {
    try {
        let apiObj = await apiModel.create({
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

        return apiObj;
    } catch (err) {
        logger.error(`Error || Error in creating apimodel for api path : ${apiLogInfo.path} in project : ${project._id}`);
        logger.error(err);
        throw err;
    }
}


exports._updateApiModelAndSaveInDb = async (apiObj, apiLogInfo) => {
    try {
        let statusCodeArray = apiObj.apiStatusCodesArray || [];
        statusCodeArray.push(apiLogInfo.statusCode);
        let mostCapturedStatusCode = _getMostCapturedStatusCode(statusCodeArray);
        let averageResponseTime = _getAverageResponseTime(apiLogInfo.responseTime, apiObj);
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
    } catch (err) {
        logger.error(`Error || Error in updating the api model for apiId : ${apiObj._id}`);
        logger.error(err);
        throw err;
    }
}


module.exports._isApiDown = _isApiDown;
