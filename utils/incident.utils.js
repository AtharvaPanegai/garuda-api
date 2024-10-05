const Incident = require("../models/incident.model");
const logger = require("logat");


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