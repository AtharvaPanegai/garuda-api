const Project = require("../models/project.model")
const ApiModel = require("../models/api.model");
const logger = require("logat");
const { _isRadarExists } = require("./radar.utils");
const radarModel = require("../models/radar.model");
const moment = require("moment");
exports._doesProjectIdAndApiKeyMatches = async (projectId, apiKey) => {
    let result = await Project.findOne({ _id: projectId, apiKey: apiKey });

    if (result) {
        return true;
    }
    return false;
}

exports._doesThisProjectExists = async (projectId) => {
    let project = await Project.findById(projectId);
    return project;
}

exports._getProjectById = async (projectId) => {
    let project = await Project.findById(projectId);
    return project;
}
exports._getProjectUsingCustomerIdAndApiKey = async (userId, apiKey) => {
    let project = await Project.findOne({ customer: userId, apiKey: apiKey });

    return project
}

exports._getProjectsUsingCustomerId = async(customerId) =>{
    let projects = await Project.find({customer : customerId});
    return projects;
}

exports._updateProjectDetailsUsingId = async (projectId, updateObj) => {
    try {
        await Project.findByIdAndUpdate(projectId, updateObj);
        return true;
    } catch (err) {
        logger.error(`Error || Error in updating the project with given updateObj for projectId : ${projectId}`);
        logger.error(err);
        return false;
    }
}


exports._isOnCallPersonExistsForThisProject = async (projectId) => {
    try {
        const project = await Project.findById(projectId).select('onCallPerson');
        if (project && project.onCallPerson) {
            const { onCallPersonEmail, onCallPersonPhoneNumber, onCallPersonName } = project.onCallPerson;
            return (onCallPersonEmail || onCallPersonPhoneNumber || onCallPersonName);
        }
        return false;
    } catch (err) {
        logger.error(`Error || Error checking onCallPerson for projectId : ${projectId}`);
        logger.error(err);
        return false;
    }
}

exports._getTotalApisForProjectCount = async (projectId) =>{
    try{
        let countOfApis = await ApiModel.countDocuments({project : projectId}); 
        return countOfApis;
    }catch(err){
        logger.error(`Error || Error in getting total apis added in project with Id : ${projectId}`);
        logger.error(err);
        throw err;
    }
}

exports._getTotalApisForProject = async(projectId) =>{
    try{
        let countOfApis = await ApiModel.find({project : projectId}); 
        return countOfApis;
    }catch(err){
        logger.error(`Error || Error in getting total apis added in project with Id : ${projectId}`);
        logger.error(err);
        throw err;
    }
}


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

const _calculateHitsForLast7Days = (radarObjects) => {
    const hitsByDay = {};

    // Traverse through each radar object
    radarObjects.forEach(radar => {
        radar.hitsPerTimeFrame.forEach(frame => {
            const day = moment(frame.timeframe).startOf('day').format('YYYY-MM-DD'); // Get day part
            if (!hitsByDay[day]) {
                hitsByDay[day] = 0;
            }
            hitsByDay[day] += frame.hits; // Sum the hits for each day
        });
    });

    const last7Days = [];
    for (let i = 0; i < 7; i++) {
        const day = moment().subtract(i, 'days').format('YYYY-MM-DD');
        last7Days.push({
            date: day,
            hits: hitsByDay[day] || 0 // Get hits or 0 if no hits for the day
        });
    }

    return last7Days;
};


const _generateStatusSummary = (radarsForProject)=> {
    // Mapping of status codes to their corresponding names
    const statusMapping = {
        200: "Success",
        201: "Created",
        202: "Accepted",
        204: "No Content",
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        408: "Request Timeout",
        429: "Rate Limit",
        500: "Internal Server Error",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
        100: "Rate Limit",
        300: "Timeout",
    };

    // Object to accumulate counts for each status code
    const statusCountMap = {};

    // Iterate through the input data
    radarsForProject.forEach(api => {
        api.statusCodesPerTimeFrame.forEach(statusEntry => {
            statusEntry.statusCodes.forEach(codeEntry => {
                const statusCode = codeEntry.statusCode;
                const count = codeEntry.count;

                // Initialize or update the count for the status code
                if (!statusCountMap[statusCode]) {
                    statusCountMap[statusCode] = 0;
                }
                statusCountMap[statusCode] += count;
            });
        });
    });

    // Transform the accumulated data into the desired format
    return Object.keys(statusCountMap).map(statusCode => {
        return {
            name: statusMapping[parseInt(statusCode, 10)] || `Status ${statusCode}`,
            value: statusCountMap[statusCode],
        };
    });
}


exports._getOverallStatusCodesAndGraphDataForProjectReport = async (projectId) =>{
    try{            
        let statusCodesArray = [];
        let radarsForProject = await radarModel.find({project:projectId});
        for(let radar of radarsForProject){
            statusCodesArray.push(radar.apiMostCapturedStatusCode);
        }

        let apiHitsReport = _calculateHitsForLast7Days(radarsForProject);
        let mostCapturedStatusCode = _getMostCapturedStatusCode(statusCodesArray);
        let statusSummaryArray = _generateStatusSummary(radarsForProject);
        return {mostCapturedStatusCode,apiHitsReport,statusSummaryArray};

    }catch(err){    
        logger.error(`Error || Error in getting the most common status across all apis hosted for project : ${projectId}`);
        logger.error(err);
        throw err;
    }
}


exports._getOnCallPersonFromProjectId = async (projectId) =>{
    try{
        let project = await this._getProjectById(projectId);
        return project.onCallPerson || {};
    }catch(err){
        logger.error(`Error || Error getting the onCall Person for the Project : ${projectId}`);
        logger.error(err);
        throw err;
    }
}