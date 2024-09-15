const Project = require("../models/project.model")
const logger = require("logat");
exports._doesProjectIdAndApiKeyMatches = async (projectId,apiKey) =>{
    let result = await Project.findOne({_id : projectId,apiKey : apiKey});

    if(result){
        return true;
    }
    return false;
}

exports._doesThisProjectExists = async(projectId) =>{
    let project = await Project.findById(projectId);
    return project; 
}

exports._getProjectById = async(projectId) =>{
    let project = await Project.findById(projectId);
    return project;
}
exports._getProjectUsingCustomerIdAndApiKey = async (userId,apiKey) =>{
    let project = await Project.findOne({customer : userId,apiKey : apiKey});

    return project
}

exports._updateProjectDetailsUsingId = async (projectId,updateObj) =>{
    try{
        await Project.findByIdAndUpdate(projectId,updateObj);
        return true;
    }catch(err){
        logger.error(`Error || Error in updating the project with given updateObj for projectId : ${projectId}`);
        logger.error(err);
        return false;
    }
}
