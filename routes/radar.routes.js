const express = require("express");
const router = express.Router();
const { onboardApisAsPerHits } = require("../controllers/radar.controller");

router.route("/radar/monitorapi").post(onboardApisAsPerHits)


module.exports = router;