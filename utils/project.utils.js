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
    if(statusCodesArray.length > 1){

        const statusCodeCount = {};
        
        statusCodesArray.forEach(code => {
            statusCodeCount[code] = (statusCodeCount[code] || 0) + 1;
        });
        
        const mostCapturedStatusCode = Object.keys(statusCodeCount).reduce((a, b) =>
            statusCodeCount[a] > statusCodeCount[b] ? a : b
    );
    
    return parseInt(mostCapturedStatusCode);
    }else{
        return null
    }
};

const _calculateHitsForLast7Days = (radarObjects) => {
    const hitsByDay = {};

    // Handle empty or null input
    if (!radarObjects || radarObjects.length === 0) {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const day = moment().subtract(i, 'days').format('YYYY-MM-DD');
            last7Days.push({
                date: day,
                hits: 0
            });
        }
        return last7Days;
    }

    // Traverse through each radar object with null checks
    radarObjects.forEach(radar => {
        if (radar && radar.hitsPerTimeFrame && Array.isArray(radar.hitsPerTimeFrame)) {
            radar.hitsPerTimeFrame.forEach(frame => {
                if (frame && frame.timeframe && frame.hits !== undefined) {
                    const day = moment(frame.timeframe).startOf('day').format('YYYY-MM-DD'); // Get day part
                    if (!hitsByDay[day]) {
                        hitsByDay[day] = 0;
                    }
                    hitsByDay[day] += frame.hits || 0; // Sum the hits for each day
                }
            });
        }
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const day = moment().subtract(i, 'days').format('YYYY-MM-DD');
        last7Days.push({
            date: day,
            hits: hitsByDay[day] || 0 // Get hits or 0 if no hits for the day
        });
    }

    return last7Days.reverse();
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

    // Handle empty or null input
    if (!radarsForProject || radarsForProject.length === 0) {
        return [{
            name: "No Data Available",
            value: 1
        }];
    }

    // Object to accumulate counts for each status code
    const statusCountMap = {};

    // Iterate through the input data with proper null checks
    radarsForProject.forEach(api => {
        if (api && api.statusCodesPerTimeFrame && Array.isArray(api.statusCodesPerTimeFrame)) {
            api.statusCodesPerTimeFrame.forEach(statusEntry => {
                if (statusEntry && statusEntry.statusCodes && Array.isArray(statusEntry.statusCodes)) {
                    statusEntry.statusCodes.forEach(codeEntry => {
                        if (codeEntry && codeEntry.statusCode !== undefined && codeEntry.statusCode !== null) {
                            const statusCode = String(codeEntry.statusCode);
                            const count = codeEntry.count || 0;

                            // Initialize or update the count for the status code
                            if (!statusCountMap[statusCode]) {
                                statusCountMap[statusCode] = 0;
                            }
                            statusCountMap[statusCode] += count;
                        }
                    });
                }
            });
        }
    });

    // If no status codes were found, return default data
    if (Object.keys(statusCountMap).length === 0) {
        return [{
            name: "No Data Available",
            value: 1
        }];
    }

    // Transform the accumulated data into the desired format
    return Object.keys(statusCountMap).map(statusCode => {
        const statusName = statusMapping[parseInt(statusCode, 10)];
        return {
            name: statusName || `Status ${statusCode}`,
            value: statusCountMap[statusCode] || 0,
        };
    }).filter(item => item.value > 0); // Filter out items with 0 value
}


exports._getOverallStatusCodesAndGraphDataForProjectReport = async (projectId) =>{
    try{            
        let statusCodesArray = [];
        let radarsForProject = await radarModel.find({project:projectId});
        
        // Handle empty radar data
        if (!radarsForProject || radarsForProject.length === 0) {
            return {
                mostCapturedStatusCode: null,
                apiHitsReport: _calculateHitsForLast7Days([]),
                statusSummaryArray: [{
                    name: "No Data Available",
                    value: 1
                }]
            };
        }

        for(let radar of radarsForProject){
            if (radar && radar.apiMostCapturedStatusCode !== undefined && radar.apiMostCapturedStatusCode !== null) {
                statusCodesArray.push(radar.apiMostCapturedStatusCode);
            }
        }

        let apiHitsReport = _calculateHitsForLast7Days(radarsForProject);
        let mostCapturedStatusCode = _getMostCapturedStatusCode(statusCodesArray);
        let statusSummaryArray = _generateStatusSummary(radarsForProject);
        
        // Ensure we always return valid data
        return {
            mostCapturedStatusCode: mostCapturedStatusCode || null,
            apiHitsReport: apiHitsReport || [],
            statusSummaryArray: statusSummaryArray && statusSummaryArray.length > 0 ? statusSummaryArray : [{
                name: "No Data Available",
                value: 1
            }]
        };

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