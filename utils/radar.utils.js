const logger = require("logat");
const ApiModel = require("../models/apiModel");
const { _isObjectEmpty } = require("./global.utils");
const apiModel = require("../models/apiModel");

exports._doesThisApiAlreadyExists = async (apiMethod,path,projectId) =>{
    let apiPath = projectId+path;

    let apiObj = await ApiModel.find({apiEndPoint : apiPath,apiMethod : apiMethod,project : projectId});

    if(!_isObjectEmpty(apiObj)){
        return true;
    }else{
        return false;
    }
}


exports._isApiDown = (apiStatusCode) => {
    if (apiStatusCode >= 200 && apiStatusCode < 400) {
        return false;
    } else {
        return true; 
    }
};

exports._findApiUsingProjectKeyAndPath = async (projectId,path) =>{
    let apiPath = projectId + path;
    let apiObj = await apiModel.findOne({apiEndPoint : apiPath});
    return apiObj;
}


exports._updateApiModelUsingId = async (apiId,updateObj) =>{
    let updatedObject = await apiModel.updateOne({_id: apiId},updateObj);
    return updatedObject;
}

exports._getAverageResponseTime = (newResponseTime,apiObj) => {
    let totalResponseTime = apiObj.totalHitsTillNow * apiObj.apiAverageResponseTime.replace(" ms", "")
    const numericResponseTime = parseFloat(newResponseTime.replace(" ms", ""));
    
    totalResponseTime += numericResponseTime;
    let totalApiHits = apiObj.totalHitsTillNow +1;
    
    return (totalResponseTime / totalApiHits).toFixed(3) + ' ms'; 
};

exports._getMostCapturedStatusCode = (statusCodesArray) => {
    const statusCodeCount = {};

    statusCodesArray.forEach(code => {
        statusCodeCount[code] = (statusCodeCount[code] || 0) + 1;
    });

    const mostCapturedStatusCode = Object.keys(statusCodeCount).reduce((a, b) => 
        statusCodeCount[a] > statusCodeCount[b] ? a : b
    );

    return parseInt(mostCapturedStatusCode);
};
