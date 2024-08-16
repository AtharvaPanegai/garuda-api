const logger = require("logat");
const ApiModel = require("../models/apiModel");
const { _isObjectEmpty } = require("./global.utils");

exports._doesThisApiAlreadyExists = async (apiMethod,path,userId,apiKey) =>{
    let apiPath = apiKey+path;
    let apiObj = await ApiModel.find({apiEndPoint : apiPath,apiMethod : apiMethod,customer : userId});

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


exports._getAverageResponseTime = (newResponseTime) => {
    const numericResponseTime = parseFloat(newResponseTime.replace(" ms", ""));
    
    totalResponseTime += numericResponseTime;
    totalApiHits += 1;
    
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
