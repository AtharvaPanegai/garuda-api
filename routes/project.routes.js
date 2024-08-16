const express = require("express");
const router = express.Router();
const { createProject, createProjectApiKey } = require("../controllers/project.controller");
const { isLoggedIn } = require("../middlewares/auth.middleware");

// router.route("/create").post(createProject);
router.route("/createapikey").post(createProjectApiKey);
router.route("/create").post(createProject)

module.exports = router;