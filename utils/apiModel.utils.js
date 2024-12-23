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
        return apiDoc
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
            project: project._id,
            customer: project.customer,
            isCurrentlyDown: _isApiDown(apiLogInfo.statusCode),
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
        // Update the apiModel
        let updateObj = {
            "isCurrentlyDown": _isApiDown(apiLogInfo.statusCode),
        };
        await _updateApiModelUsingId(apiObj._id, updateObj);
    } catch (err) {
        logger.error(`Error || Error in updating the api model for apiId : ${apiObj._id}`);
        logger.error(err);
        throw err;
    }
}


exports._getAllApisByProjectId = async (projectId) =>{
    try{
        let apis = await apiModel.find({project : projectId});
        return apis;
    }catch(err){
        logger.error(`Error || Error in finding the apis with projectId : ${projectId}`);
        logger.error(err);
        throw err;   
    }
}


module.exports._isApiDown = _isApiDown;
module.exports._updateApiModelUsingId = _updateApiModelUsingId;
