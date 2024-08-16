const projectModel = require("../models/projectModel")

exports._doesThisKeyBelongsToCustomerAndProject = async (userId,apiKey) =>{
    let result = await projectModel.findOne({customer : userId,apiKey : apiKey});

    if(result){
        return true;
    }
    return false;
}

exports._getProjectUsingCustomerIdAndApiKey = async (userId,apiKey) =>{
    let project = await projectModel.findOne({customer : userId,apiKey : apiKey});

    return project
}