const express = require("express");
const router = express.Router();
const { onboardApisAsPerHits, getReportOfSingleApi } = require("../controllers/radar.controller");

router.route("/radar/monitorapi").post(onboardApisAsPerHits);
router.route("/radar/singlereport").post(getReportOfSingleApi);


module.exports = router;