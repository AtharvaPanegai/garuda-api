const express = require("express");
const router = express.Router();
const { onboardApisAsPerHits, getReportOfSingleApi, enableOrDisableRadarOnApi, bulkProcessFromCaching } = require("../controllers/radar.controller");

router.route("/radar/monitorapi").post(onboardApisAsPerHits);
router.route("/radar/singlereport").post(getReportOfSingleApi);
router.route("/radar/config").post(enableOrDisableRadarOnApi);
router.route("/radar/bulkupdate").post(bulkProcessFromCaching)


module.exports = router;