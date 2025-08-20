const BigPromise = require("../middlewares/BigPromise");
const { v4: uuidv4 } = require('uuid');
const logger = require("logat");
const User = require("../models/user.model");
const CustomError = require("../utils/customError");
const Project = require("../models/project.model");
const { _updateProjectDetailsUsingId, _isOnCallPersonExistsForThisProject, _doesThisProjectExists, _getTotalApisForProject, _getOverallStatusCodesAndGraphDataForProjectReport, _getProjectsUsingCustomerId, _getTotalApisForProjectCount } = require("../utils/project.utils");
const { _saveProjectInUser } = require("../utils/user.utils");
const { _getIncidentsAsPerProject } = require("../utils/incident.utils");
const moment = require("moment");

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
        await _saveProjectInUser(userId, project._id)
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

    let isOnCallPersonExists = await _isOnCallPersonExistsForThisProject(projectId);

    if (!isOnCallPersonExists) {
        logger.error(`Error || On Call Person does not exists for this project : ${projectId}`);
        return res.status(422).json({
            statusCode: 422,
            message: "Please Add On Call Person Before creating apiKey"
        })
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
        await _updateProjectDetailsUsingId(projectId, { onCallPerson: onCallPerson });
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


exports.getCummulitiveProjectReport = BigPromise(async (req, res, next) => {
    const { projectId } = req.body;

    if (!projectId) {
        logger.error(`Error || Missing projectid while fetching the project report`);
        throw new CustomError("Please provide the projectId for the project report", 400);
    }

    let project = await _doesThisProjectExists(projectId);

    if (!project) {
        logger.error(`Error || Error in getting the project with given projectId : ${projectId}`);
        throw new CustomError("Project With Given ProjectId does not exist!", 404);
    }

    let projectReport;

    try {
        let totalApisForProject = await _getTotalApisForProject(projectId);
        let totalIncidents = await _getIncidentsAsPerProject(projectId);
        let { mostCapturedStatusCode, apiHitsReport,statusSummaryArray } = await _getOverallStatusCodesAndGraphDataForProjectReport(projectId);
        let projectAge = moment(project.createdAt).fromNow();

        // Ensure statusSummaryArray is always an array
        if (!statusSummaryArray || !Array.isArray(statusSummaryArray)) {
            statusSummaryArray = [{
                name: "No Data Available",
                value: 1
            }];
        }

        // Ensure apiHitsReport is always an array
        if (!apiHitsReport || !Array.isArray(apiHitsReport)) {
            apiHitsReport = [];
        }

        projectReport = {
            project,
            totalApisCount: totalApisForProject ? totalApisForProject.length : 0,
            totalIncidentsReported: totalIncidents || [],
            overAllStatusCode: mostCapturedStatusCode || "N/A",
            projectAge: projectAge,
            onCallPerson: project.onCallPerson?.onCallPersonName || "No onCall Person",
            apiHitsReport: apiHitsReport,
            statusSummaryArray,
            totalApisForProject: totalApisForProject || []
        }

    } catch (err) {
        logger.error(`Error || Error in Generating Report for Project : ${projectId}`);
        logger.error(err);
        throw new CustomError("Error in generating Project report, Try again after sometime", 500);
    }

    res.status(200).json({
        message: "Project Report Generated Sucessfully!",
        projectReport
    })

})


exports.getAllApisInProject = BigPromise(async (req, res, next) => {
    const { projectId, customerId } = req.body;

    let project = await _doesThisProjectExists(projectId);

    if (project && project.customer == customerId) {
        let apis = await _getTotalApisForProject(projectId);
        res.status(200).json({
            message: "Apis fetched successfully",
            apis
        })
    } else {
        let error = new CustomError("Authorization Failed", 401);
        throw error;
    }
})
