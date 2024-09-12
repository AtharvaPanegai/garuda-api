const projectModel = require("../models/projectModel")

exports._doesProjectIdAndApiKeyMatches = async (projectId,apiKey) =>{
    let result = await projectModel.findOne({_id : projectId,apiKey : apiKey});

    if(result){
        return true;
    }
    return false;
}

exports._doesThisProjectExists = async(projectId) =>{
    let project = await projectModel.findById(projectId);
    return project; 
}

exports._getProjectById = async(projectId) =>{
    let project = await projectModel.findById(projectId);
    return project;
}
exports._getProjectUsingCustomerIdAndApiKey = async (userId,apiKey) =>{
    let project = await projectModel.findOne({customer : userId,apiKey : apiKey});

    return project
}