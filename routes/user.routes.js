const express = require("express");
const router = express.Router();
const { signUp, signIn, handleMultipleMethods, handleUniqueUsernames, getAllProjectsUnderCustomer, logout } = require("../controllers/user.controller");


router.route("/signup").post(signUp);
router.route("/signin").post(signIn);
router.route("/signout").get(logout)
// signup journey api
router.route("/user/checkusername").post(handleUniqueUsernames);
router.route("/user/projects").post(getAllProjectsUnderCustomer)

// standard user methods
router.route("/user/:id").get(handleMultipleMethods);
router.route("/user/:id").post(handleMultipleMethods);
router.route("/user/:id").put(handleMultipleMethods);
router.route("/user/:id").delete(handleMultipleMethods);




module.exports = router;