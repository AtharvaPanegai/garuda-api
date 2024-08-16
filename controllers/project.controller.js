const BigPromise = require("../middlewares/BigPromise");
const { v4: uuidv4 } = require('uuid');
const logger = require("logat");
const User = require("../models/userModel");
const CustomError = require("../utils/customError");
const Project = require("../models/projectModel");

exports.createProject = BigPromise(async (req,res,next)=>{
    const {userId,projectName} = req.body;

    if(!userId || !projectName){
        return new CustomError("Fields are missing, please provide all the required fields",401);
    }
    let project;
    try{
        logger.info(`INFO || Project is being created for user : ${userId} with name : ${projectName}`);
        project = await Project.create({
            projectName : projectName,
            customer : userId
        })
    }catch(err){
        logger.error(`Error || Error in creating projet for user : ${userId}`);
        logger.error(err);
        throw err;
    }
    
    logger.info(`INFO || Project created successfully for user : ${userId} with projectId : ${project._id}`);

    res.status(200).json({
        message : "Project Created successfully!",
        project
    })

})

exports.createProjectApiKey = BigPromise(async (req, res, next) => {
    const { userId, projectId } = req.body;
    
    let user = await User.findById(userId);

    if(!user){
        logger.error(`Error || No Customer Exists with userId : ${userId}`);
        return new CustomError("No Customer Found with this userId",404);
    }

    let apiKeyCreated = uuidv4();
    let project = await Project.updateOne({_id:projectId},{apiKey : apiKeyCreated});

    res.status(200).json({
        message : "API Key for project Created!",
        apiKey : apiKeyCreated,
    })
})