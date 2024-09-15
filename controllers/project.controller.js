const BigPromise = require("../middlewares/BigPromise");
const { v4: uuidv4 } = require('uuid');
const logger = require("logat");
const User = require("../models/user.model");
const CustomError = require("../utils/customError");
const Project = require("../models/project.model");
const { _updateProjectDetailsUsingId } = require("../utils/project.utils");

exports.createProject = BigPromise(async (req, res, next) => {
    const { userId, projectName } = req.body;

    if (!userId || !projectName) {
        return new CustomError("Fields are missing, please provide all the required fields", 401);
    }
    let project;
    try {
        logger.info(`INFO || Project is being created for user : ${userId} with name : ${projectName}`);
        project = await Project.create({
            projectName: projectName,
            customer: userId
        })
    } catch (err) {
        logger.error(`Error || Error in creating projet for user : ${userId}`);
        logger.error(err);
        throw err;
    }

    logger.info(`INFO || Project created successfully for user : ${userId} with projectId : ${project._id}`);

    res.status(200).json({
        message: "Project Created successfully!",
        project
    })

})

exports.createProjectApiKey = BigPromise(async (req, res, next) => {
    const { userId, projectId } = req.body;

    let user = await User.findById(userId);

    if (!user) {
        logger.error(`Error || No Customer Exists with userId : ${userId}`);
        return new CustomError("No Customer Found with this userId", 404);
    }

    let apiKeyCreated = uuidv4();
    let project = await Project.updateOne({ _id: projectId }, { apiKey: apiKeyCreated });

    res.status(200).json({
        message: "API Key for project Created!",
        apiKey: apiKeyCreated,
    })
})


exports.addOnCallPersonForProject = BigPromise(async (req, res, next) => {
    const { onCallPersonEmail, onCallPersonPhoneNumber, onCallPersonName, projectId } = req.body;

    if (!onCallPersonName || !onCallPersonEmail || !onCallPersonPhoneNumber || !projectId) {
        logger.error(`Error || Mandatory fields are missing while setting up on call person`);
        return res.status(422).json({
            statusCode: 422,
            message: "Mandatory Fields are missing!"
        })
    }

    let onCallPerson = {
        onCallPersonEmail,
        onCallPersonPhoneNumber,
        onCallPersonName,
    }

    try {
        await _updateProjectDetailsUsingId(projectId, {onCallPerson : onCallPerson});
    } catch (err) {
        logger.error(`Error || Error in updating the on call person for projectId : ${projectId}`);
        logger.error(err);
        throw err;
    }

    logger.info(`INFO || On Call Person added successfully for projectId : ${projectId}`);

    return res.status(200).json({
        statusCode: 200,
        message: "On Call Person Updated for your project"
    })
})