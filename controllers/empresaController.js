const Empresa = require('../models/Empresa');
const { fetchCompanies, scrapeCompanyData } = require('../services/scraperService');

const searchAndScrapeCompanies = async (req, res) => {
  const { startDate, endDate, cookies, query } = req.body;

  try {
    const initialData = await fetchCompanies(query, cookies);

    if (!initialData || !initialData.data) {
      return res.status(400).json({ error: 'Resposta inesperada da API' });
    }

    const totalCompanies = initialData.data.count;
    const totalPages = Math.ceil(totalCompanies / 20);
    let allData = [];

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      query.page = currentPage;
      const pageData = await fetchCompanies(query, cookies);

      if (!pageData || !pageData.data) {
        throw new Error(`Resposta inesperada da API na página ${currentPage}`);
      }

      allData = allData.concat(pageData.data.cnpj);
    }

    let scrapedData = [];

    for (const company of allData) {
      const existingCompany = await Empresa.findOne({ cnpj: company.cnpj });
      if (!existingCompany) {
        const url = `https://casadosdados.com.br/solucao/cnpj/${company.razao_social.toLowerCase().replace(/ /g, '-')}-${company.cnpj}`;
        const companyDetails = await scrapeCompanyData(url, cookies);
        if (companyDetails) {
          const newCompany = new Empresa(companyDetails);
          await newCompany.save();
          scrapedData.push(companyDetails);
        }
      }
    }

    res.json(scrapedData);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar a requisição', details: error.message });
  }
};

module.exports = { searchAndScrapeCompanies };
