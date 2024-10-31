const Incident = require("../models/incident.model");
const logger = require("logat");
const moment = require("moment");

exports._getIncidentsAsPerProject = async (projectId) =>{
    try{
        let incidents = await Incident.find({project:projectId});
        return incidents;
    }catch(err){
        logger.error(`Error || Error in getting incidents according to project with given ${projectId}`);
        logger.error(err);
        throw err;
    }
}

const _reportNewIncident = async (apiObj,apiLogInfo) =>{
    try{
        let newIncidentObj = {
            project : apiObj.project,
            apiId : apiObj._id,
            timeOfIncident : Date.now(),
            firstFailedApiLog : apiLogInfo,
            totalFailedApiCalls : 1
        }
        await Incident.create(newIncidentObj);
    }catch(err){
        logger.error(`Error || Error in reporting incident for api : ${apiObj._id}`);
        logger.error(err);
        throw err;
    }
} 


const _checkIfAnyIncidentAroundSameTime = async (apiId) => {
    try {
      const fifteenMinutesAgo = moment().subtract(15, 'minutes').toDate();  
      const recentIncident = await Incident.findOne({
        apiId: apiId,
        createdAt: { $gte: fifteenMinutesAgo }
      });
  
      return recentIncident ? recentIncident : null;
    } catch (err) {
      logger.error(`Error || Error while checking recent incident: ${err}`);
      return null;
    }
}

const _updateIncident = async (updatedIncidentDoc) =>{
    try{
       await Incident.findByIdAndUpdate(updatedIncidentDoc._id,updatedIncidentDoc);
    }catch(err){
        logger.error(`Error || Error in updating incident for api : ${updatedIncidentDoc.apiId}`);
        logger.error(err);
        throw err;
    }
}

exports._reportIncident = async (apiObj,apiLogInfo) =>{
    try{
        let isThisOldIncident = await _checkIfAnyIncidentAroundSameTime(apiObj._id);

        if(!isThisOldIncident){
            await _reportNewIncident(apiObj,apiLogInfo);
            logger.info(`INFO || New Incident Reported for API : ${apiObj._id}`);

        }else{
            isThisOldIncident.totalFailedApiCalls = isThisOldIncident.totalFailedApiCalls + 1;
            await _updateIncident(isThisOldIncident);
            logger.info(`INFO || Incident Updated successfully for api : ${apiObj._id}`);
        }
    }catch(err){
        logger.error(`Error || Error in reporting incident for api : ${apiObj._id}`);
        logger.error(err);
        throw err;
    }
}

exports._addIncidentSteps = async (stepsObject,apiId) =>{
    try{
        let recentIncident = await _checkIfAnyIncidentAroundSameTime(apiId);
        recentIncident.stepsAfterFailure.push(stepsObject);
        await _updateIncident(recentIncident);
        logger.info(`INFO || Steps updated in the incident doc for api : ${apiId}`);
    }catch(err){
        logger.error(`Error || Error adding incident steps`);
        logger.error(err);
        throw err;
    }
}