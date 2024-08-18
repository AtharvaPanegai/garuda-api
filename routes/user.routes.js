const express = require("express");
const router = express.Router();
const { signUp, signIn, handleMultipleMethods } = require("../controllers/user.controller");


router.route("/signup").post(signUp);
router.route("/signin").post(signIn);

// standard user methods
router.route("/user/:id").get(handleMultipleMethods);
router.route("/user/:id").post(handleMultipleMethods);
router.route("/user/:id").put(handleMultipleMethods);
router.route("/user/:id").delete(handleMultipleMethods);



module.exports = router;