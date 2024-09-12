const apiPerformanceModel = require("../models/apiPerformanceModel");
const logger = require("logat");

exports._isApiPerformaceModelExists = async (apiId) => {
    let performaceModel = await apiPerformanceModel.findOne({ apiId: apiId });

    if (!performaceModel) {
        return null;
    } else {
        return performaceModel;
    }
}


exports._updatePerformance = async (performanceId, updateObj) => {
    try {
        await apiPerformanceModel.updateOne({ _id: performanceId }, updateObj);
        return true;
    } catch (err) {
        logger.error(`Error || Error in updating the perfromace metrics for id : ${performanceId}`);
        logger.error(err);
        throw err;
    }
}

exports._createApiPerformaceModel = async (creationObject) => {
    try {
        let apiPerformance = await apiPerformanceModel.create(creationObject);
        return apiPerformance;
    } catch (err) {
        logger.error(`Error || Error in creating performance model for ${creationObject.apiId}`);
        logger.error(err);
        throw err;
    }
}

exports._getCreationObject = (apiLogInfo, apiId) => {
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
        statusCodesPerTimeFrame: statusCodesArray
    };

    return creationObject;
}

exports._getUpdationObject = (apiLogInfo, radar) => {
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

    let updationObject = {
        apiId: radar.apiId,
        hitsPerTimeFrame: hitsArray,
        statusCodesPerTimeFrame: statusCodesArray
    };

    return updationObject;
}
