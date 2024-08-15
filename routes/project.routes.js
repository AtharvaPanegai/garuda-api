const express = require("express");
const { createProject, createProjectApiKey } = require("../controllers/project.controller");
const { isLoggedIn } = require("../middlewares/auth.middleware");
const router = express.Router();

// router.route("/create").post(createProject);
router.route("/createapikey").post(createProjectApiKey);
router.route("/create").post(createProject)

module.exports = router;