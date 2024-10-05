const Radar = require("../models/radar.model");
const logger = require("logat");

exports._isRadarExists = async (apiId) => {
    let performaceModel = await Radar.findOne({ apiId: apiId });

    if (!performaceModel) {
        return null;
    } else {
        return performaceModel;
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



const _getCreationObject = (apiLogInfo, apiId) => {
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
        apiId: apiId,
        hitsPerTimeFrame: hitsArray,
        statusCodesPerTimeFrame: statusCodesArray,
        apiMostRecentStatusCode: apiLogInfo.statusCode,
        apiMostRecentResponseTime: apiLogInfo.responseTime,
        apiMostCapturedStatusCode: apiLogInfo.statusCode,
        apiAverageResponseTime: apiLogInfo.responseTime,
        totalHitsTillNow : 1
    };

    return creationObject;
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

    let avgResponseTime = _getAverageResponseTime(apiLogInfo.responseTime,radar);
    let avgStatuscode = _getMostCapturedStatusCode(radar,apiLogInfo.statusCode);

    let updationObject = {
        apiId: radar.apiId,
        hitsPerTimeFrame: hitsArray,
        statusCodesPerTimeFrame: statusCodesArray,
        apiMostRecentStatusCode: apiLogInfo.statusCode,
        apiMostRecentResponseTime: apiLogInfo.responseTime,
        apiMostCapturedStatusCode: avgStatuscode,
        apiAverageResponseTime: avgResponseTime,
        totalHitsTillNow : radar.totalHitsTillNow + 1
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

exports._addRadarOnApi = async (apiLogInfo, apiId) => {
    try {
        let creationObject = _getCreationObject(apiLogInfo, apiId);
        let apiPerformance = await Radar.create(creationObject);
        return apiPerformance;
    } catch (err) {
        logger.error(`Error || Error in creating performance model for ${apiId}`);
        logger.error(err);
        throw err;
    }
}
