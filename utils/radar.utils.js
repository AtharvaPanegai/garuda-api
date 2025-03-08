const apiModel = require("../models/api.model");
const Radar = require("../models/radar.model");
const logger = require("logat");

exports._isRadarExists = async (apiId) => {
    let radarModel = await Radar.findOne({ apiId: apiId });

    if (!radarModel) {
        return null;
    } else {
        return radarModel;
    }
}

const _getAverageResponseTime = (newResponseTime, radarObj) => {
    let totalResponseTime = radarObj.totalHitsTillNow * radarObj.apiAverageResponseTime.replace(" ms", "")
    const numericResponseTime = parseFloat(newResponseTime.replace(" ms", ""));

    totalResponseTime += numericResponseTime;
    let totalApiHits = radarObj.totalHitsTillNow + 1;

    return (totalResponseTime / totalApiHits).toFixed(3) + ' ms';
};

const _getMostCapturedStatusCode = (radarObj, newStatusCode) => {
    const statusCodes = {};

    // Traverse through all statusCodesPerTimeFrame to calculate the cumulative count of each status code
    radarObj.statusCodesPerTimeFrame.forEach((timeFrame) => {
        timeFrame.statusCodes.forEach((statusCodeObj) => {
            const statusCode = statusCodeObj.statusCode;
            const count = statusCodeObj.count;

            // Accumulate count for each status code
            if (statusCodes[statusCode]) {
                statusCodes[statusCode] += count;
            } else {
                statusCodes[statusCode] = count;
            }
        });
    });

    // Include the new API hit's status code in the count
    if (statusCodes[newStatusCode]) {
        statusCodes[newStatusCode] += 1; // Increment the count for the new status code
    } else {
        statusCodes[newStatusCode] = 1; // Add the new status code with an initial count of 1
    }

    // Find the status code with the highest count
    let mostCapturedStatusCode = null;
    let maxCount = 0;

    for (const [code, count] of Object.entries(statusCodes)) {
        if (count > maxCount) {
            mostCapturedStatusCode = code;
            maxCount = count;
        }
    }

    return mostCapturedStatusCode;
};

const _getBulkUpdateAvgResponseTime = (apiLogs,bulkHits,radarHits,radarAvgResponseTime) =>{
    // calculate total response time for the bulk hits
    let totalResponseTimeForBulk = 0;
    apiLogs.forEach((apiLog)=>{
        totalResponseTimeForBulk += parseFloat(apiLog?.responseTime?.replace(" ms", ""));
    })

    // calculate total response time for radar object
    let totalResponseTimeForRadar = radarHits * radarAvgResponseTime.replace(" ms", "");

    // combine both totalresponse times
    let totalResponseTimeBoth = totalResponseTimeForBulk + totalResponseTimeForRadar;

    return (totalResponseTimeBoth / (bulkHits + radarHits)).toFixed(3) + ' ms';

};

const _getBulkUpdateAvgStatusCode = (apiLogs,radarObj) =>{
    const statusCodes = {};

    // Traverse through all statusCodesPerTimeFrame to calculate the cumulative count of each status code
    radarObj.statusCodesPerTimeFrame.forEach((timeFrame) => {
        timeFrame.statusCodes.forEach((statusCodeObj) => {
            const statusCode = statusCodeObj.statusCode;
            const count = statusCodeObj.count;

            // Accumulate count for each status code
            if (statusCodes[statusCode]) {
                statusCodes[statusCode] += count;
            } else {
                statusCodes[statusCode] = count;
            }
        });
    });

    // process the bulk ApiLogs
    apiLogs.forEach((apiLog) => {
        statusCodes[apiLog.statusCode] = (statusCodes[apiLog.statusCode] || 0) + 1;
    });


    // Find the status code with the highest count
    let mostCapturedStatusCode = null;
    let maxCount = 0;

    for (const [code, count] of Object.entries(statusCodes)) {
        if (count > maxCount) {
            mostCapturedStatusCode = code;
            maxCount = count;
        }
    }

    return mostCapturedStatusCode;
}

const _getCreationObject = (apiLogInfo, apiObj) => {
    let currentMinute = new Date();
    currentMinute.setSeconds(0, 0);

    let timeframe = currentMinute.toISOString();

    // Create hits array
    let hitsArray = [
        {
            timeframe: timeframe,
            hits: 1 // First hit for this timeframe
        }
    ];

    // Create status codes array
    let statusCodesArray = [
        {
            timeframe: timeframe,
            statusCodes: [
                {
                    statusCode: apiLogInfo.statusCode,
                    count: 1 // First count for this status code in the timeframe
                }
            ]
        }
    ];

    let creationObject = {
        apiId: apiObj._id,
        project : apiObj.project, 
        hitsPerTimeFrame: hitsArray,
        statusCodesPerTimeFrame: statusCodesArray,
        apiMostRecentStatusCode: apiLogInfo.statusCode,
        apiMostRecentResponseTime: apiLogInfo.responseTime,
        apiMostCapturedStatusCode: apiLogInfo.statusCode,
        apiAverageResponseTime: apiLogInfo.responseTime,
        totalHitsTillNow: 1
    };

    return creationObject;
}

const _getBulkUpdationObject = (apiLogs,radar,hits) =>{
    let currentMinute = new Date();
    currentMinute.setSeconds(0, 0);

    let timeframe = currentMinute.toISOString();

    // Initialize or retrieve hits array
    let hitsArray = radar && radar.hitsPerTimeFrame ? radar.hitsPerTimeFrame : [];
    let statusCodesArray = radar && radar.statusCodesPerTimeFrame ? radar.statusCodesPerTimeFrame : [];

    // Update hits array for the current timeframe
    let hitEntry = hitsArray.find(entry => entry.timeframe === timeframe);
    if (hitEntry) {
        hitEntry.hits += hits;
    } else {
        hitsArray.push({ timeframe: timeframe, hits: hits });
    }

    // Update status codes array for the current timeframe
    // Can optimize this by using a hashmap for status codes
    apiLogs.forEach(apiLogInfo => {
        let statusEntry = statusCodesArray.find(entry => entry.timeframe === timeframe);
        if (statusEntry) {
            let statusCodeEntry = statusEntry.statusCodes.find(status => status.statusCode === apiLogInfo.statusCode);
            if (statusCodeEntry) {
                statusCodeEntry.count += 1;
            } else {
                statusEntry.statusCodes.push({ statusCode: apiLogInfo.statusCode, count: 1 });
            }
        } else {
            statusCodesArray.push({
                timeframe: timeframe,
                statusCodes: [
                    { statusCode: apiLogInfo.statusCode, count: 1 }
                ]
            });
        }
    });


    let avgResponseTime = _getBulkUpdateAvgResponseTime(apiLogs,hits,radar.totalHitsTillNow,radar.apiAverageResponseTime);
    let avgStatuscode = _getBulkUpdateAvgStatusCode(apiLogs,radar);

    let updationObject = {
        apiId: radar.apiId,
        hitsPerTimeFrame: hitsArray,
        statusCodesPerTimeFrame: statusCodesArray,
        apiMostRecentStatusCode: apiLogs[0].statusCode,
        apiMostRecentResponseTime: apiLogs[0].responseTime,
        apiMostCapturedStatusCode: avgStatuscode,
        apiAverageResponseTime: avgResponseTime,
        totalHitsTillNow: radar.totalHitsTillNow + hits
    };

    return updationObject;
}

const _getUpdationObject = (apiLogInfo, radar) => {
    let currentMinute = new Date();
    currentMinute.setSeconds(0, 0);

    let timeframe = currentMinute.toISOString();

    // Initialize or retrieve hits array
    let hitsArray = radar && radar.hitsPerTimeFrame ? radar.hitsPerTimeFrame : [];
    let statusCodesArray = radar && radar.statusCodesPerTimeFrame ? radar.statusCodesPerTimeFrame : [];

    // Update hits array for the current timeframe
    let hitEntry = hitsArray.find(entry => entry.timeframe === timeframe);
    if (hitEntry) {
        hitEntry.hits += 1;
    } else {
        hitsArray.push({ timeframe: timeframe, hits: 1 });
    }

    // Update status codes array for the current timeframe
    let statusEntry = statusCodesArray.find(entry => entry.timeframe === timeframe);
    if (statusEntry) {
        let statusCodeEntry = statusEntry.statusCodes.find(status => status.statusCode === apiLogInfo.statusCode);
        if (statusCodeEntry) {
            statusCodeEntry.count += 1;
        } else {
            statusEntry.statusCodes.push({ statusCode: apiLogInfo.statusCode, count: 1 });
        }
    } else {
        statusCodesArray.push({
            timeframe: timeframe,
            statusCodes: [
                { statusCode: apiLogInfo.statusCode, count: 1 }
            ]
        });
    }

    let avgResponseTime = _getAverageResponseTime(apiLogInfo.responseTime, radar);
    let avgStatuscode = _getMostCapturedStatusCode(radar, apiLogInfo.statusCode);

    let updationObject = {
        apiId: radar.apiId,
        hitsPerTimeFrame: hitsArray,
        statusCodesPerTimeFrame: statusCodesArray,
        apiMostRecentStatusCode: apiLogInfo.statusCode,
        apiMostRecentResponseTime: apiLogInfo.responseTime,
        apiMostCapturedStatusCode: avgStatuscode,
        apiAverageResponseTime: avgResponseTime,
        totalHitsTillNow: radar.totalHitsTillNow + 1
    };

    return updationObject;
}


exports._updateRadar = async (radar, apiLogInfo) => {
    try {
        let updateObj = _getUpdationObject(apiLogInfo, radar);
        await Radar.updateOne({ _id: radar._id }, updateObj);
        return true;
    } catch (err) {
        logger.error(`Error || Error in updating the perfromace metrics for id : ${radar._id}`);
        logger.error(err);
        throw err;
    }
}


exports._bulkUpdateRadar = async (apiEndPoint,apiLogs,hits) =>{
    let apiObj,radarObject;
    try{
        try{

            apiObj = await apiModel.findOne({apiEndPoint :apiEndPoint},{_id : 1});
            radarObject = await Radar.findOne({apiId : apiObj._id});
        }catch(err){
            logger.error(`Error || Error in fetching the apiModel or RadarObject for apiEndPoint : ${apiEndPoint}`);
            logger.error(err);
            throw err;
        }
        let updateObject = _getBulkUpdationObject(apiLogs,radarObject,hits);
        await Radar.updateOne({_id : radarObject._id},updateObject);
        return true;
    }catch(err){
        logger.error(`Error || Error in updating the performance metrics for id : ${radarObject._id}`);
        logger.error(err);
        throw err;
    }
}

exports._addRadarOnApi = async (apiLogInfo, apiObj) => {
    try {
        let creationObject = _getCreationObject(apiLogInfo, apiObj);
        let apiPerformance = await Radar.create(creationObject);
        return apiPerformance;
    } catch (err) {
        logger.error(`Error || Error in creating performance model for ${apiObj._id}`);
        logger.error(err);
        throw err;
    }
}

exports._deleteRadarFromApi = async(apiId) =>{
    try{
        await Radar.deleteOne({apiId : apiId});
    }catch(err){
        logger.error(`Error || Error in deleting the Radar for API : ${apiId}`);
        logger.error(err);
        throw err;
    }
}

exports._generateApiHitsReport = (radarObj, graphMins) => {

    let graphOptions = {
        5: "Last 5 mins",
        60: "Last 1 hour",
        180: "Last 3 hours",
        720: "Last 12 hours",
        1440: "Last 24 hours",
    }

    let graphType = graphOptions[graphMins]
    const now = new Date();

    // Define timeframes for each graph type in milliseconds
    const timeframes = {
        "Last 5 mins": 5 * 60 * 1000,
        "Last 1 hour": 60 * 60 * 1000,
        "Last 3 hours": 3 * 60 * 60 * 1000,
        "Last 12 hours": 12 * 60 * 60 * 1000,
        "Last 24 hours": 24 * 60 * 60 * 1000,
    };

    const intervals = {
        "Last 5 mins": 1 * 60 * 1000,  // 1-minute interval
        "Last 1 hour": 5 * 60 * 1000,  // 5-minute interval
        "Last 3 hours": 30 * 60 * 1000, // 30-minute interval
        "Last 12 hours": 60 * 60 * 1000, // 1-hour interval
        "Last 24 hours": 60 * 60 * 1000, // 1-hour interval
    };

    const selectedTimeframe = timeframes[graphType];
    const selectedInterval = intervals[graphType];

    // Filter hits within the selected timeframe
    const filteredHits = radarObj.hitsPerTimeFrame.filter((hit) => {
        const hitTime = new Date(hit.timeframe);
        return now - hitTime <= selectedTimeframe;
    });

    // Group the filtered hits by the selected interval
    const groupedHits = {};

    filteredHits.forEach((hit) => {
        const hitTime = new Date(hit.timeframe);
        const roundedTime = new Date(Math.floor(hitTime.getTime() / selectedInterval) * selectedInterval); // Round to nearest interval

        const formattedTime = roundedTime.toISOString().slice(11, 16); // "HH:MM" format

        if (!groupedHits[formattedTime]) {
            groupedHits[formattedTime] = 0;
        }
        groupedHits[formattedTime] += hit.hits; // Sum hits
    });

    // Convert groupedHits object to array for the report
    const report = Object.entries(groupedHits).map(([time, hits]) => ({
        name: time,
        hits: hits,
    }));

    return report;
};

