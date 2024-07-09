const express = require('express');
const { searchAndScrapeCompanies, getSavedCompanies, getCompaniesCount } = require('../controllers/empresaController');

const router = express.Router();

router.post('/search-and-scrape-companies', searchAndScrapeCompanies);
router.get('/saved-companies', getSavedCompanies);
router.get('/companies-count', getCompaniesCount);

module.exports = router;
