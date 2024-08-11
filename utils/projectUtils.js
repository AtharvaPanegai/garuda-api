const projectModel = require("../models/projectModel")

const _doesThisKeyBelongsToCustomerAndProject = async (customerId,apiKey) =>{
    let result = await projectModel.findOne({customer : customerId,apiKey : apiKey});

    if(result){
        return true;
    }
    return false;
}


module.exports._doesThisKeyBelongsToCustomerAndProject = _doesThisKeyBelongsToCustomerAndProject;