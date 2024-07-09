const express = require('express');
const router = express.Router();
const { searchAndScrapeCompanies, getSavedCompanies, getCompaniesCount } = require('../controllers/empresaController');

router.post('/', searchAndScrapeCompanies);
router.get('/', getSavedCompanies);
router.get('/count', getCompaniesCount);

module.exports = router;
