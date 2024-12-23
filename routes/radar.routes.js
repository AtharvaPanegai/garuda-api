const express = require("express");
const router = express.Router();
const { onboardApisAsPerHits, getReportOfSingleApi, enableOrDisableRadarOnApi } = require("../controllers/radar.controller");

router.route("/radar/monitorapi").post(onboardApisAsPerHits);
router.route("/radar/singlereport").post(getReportOfSingleApi);
router.route("/radar/config").post(enableOrDisableRadarOnApi);


module.exports = router;