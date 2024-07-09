const express = require('express');
const router = express.Router();
const { searchAndScrapeCompanies } = require('../controllers/empresaController');

router.post('/scrape', searchAndScrapeCompanies);

module.exports = router;
