const express = require("express");
const router = express.Router();
const scrapperController = require("../../controllers/scrapperController");

router.post("/run", scrapperController.runScrapper);

module.exports = router;
