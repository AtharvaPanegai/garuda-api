const express = require("express");
const { createProject, createProjectApiKey } = require("../controllers/project.controller");
const router = express.Router();

router.route("/create").post(createProject);
router.route("/createapikey").post(createProjectApiKey);


module.exports = router;