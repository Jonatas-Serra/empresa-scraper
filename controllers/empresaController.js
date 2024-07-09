const fetchCompanies = require('../services/fetchCompanies');
const scrapeCompanyData = require('../services/scrapeCompanyData');
const Empresa = require('../models/Empresa');
const fs = require('fs');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const searchAndScrapeCompanies = async (req, res) => {
  const { startDate, endDate, cookies } = req.body;

  const query = {
    "query": {
      "termo": [],
      "atividade_principal": [],
      "natureza_juridica": [],
      "uf": ["BA"],
      "municipio": [],
      "bairro": [],
      "situacao_cadastral": "ATIVA",
      "cep": [],
      "ddd": []
    },
    "range_query": {
      "data_abertura": {
        "lte": endDate,
        "gte": startDate
      },
      "capital_social": {
        "lte": null,
        "gte": null
      }
    },
    "extras": {
      "somente_mei": true,
      "excluir_mei": false,
      "com_email": true,
      "incluir_atividade_secundaria": false,
      "com_contato_telefonico": true,
      "somente_fixo": false,
      "somente_celular": true,
      "somente_matriz": false,
      "somente_filial": false
    },
    "page": 1
  };

  try {
    const initialData = await fetchCompanies(query, cookies);

    if (initialData.error) {
      console.error('Erro na resposta da API:', initialData.content);
      throw new Error('Resposta inesperada da API');
    }

    if (!initialData || !initialData.data) {
      throw new Error('Resposta inesperada da API');
    }

    const totalCompanies = initialData.data.count;
    const totalPages = Math.ceil(totalCompanies / 20);

    let allData = [];
    let allCompanies = [];

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      query.page = currentPage;
      const pageData = await fetchCompanies(query, cookies);

      if (pageData.error) {
        console.error('Erro na resposta da API na página', currentPage, ':', pageData.content);
        throw new Error(`Resposta inesperada da API na página ${currentPage}`);
      }

      if (!pageData || !pageData.data) {
        throw new Error(`Resposta inesperada da API na página ${currentPage}`);
      }

      allData = allData.concat(pageData.data.cnpj);

      if (currentPage % 5 === 0) {
        await delay(2000); // Delay a cada 2 páginas
      }
    }

    for (const company of allData) {
      let existingCompany = await Empresa.findOne({ cnpj: company.cnpj });
      if (existingCompany) {
        allCompanies.push(existingCompany);
      } else {
        const url = `https://casadosdados.com.br/solucao/cnpj/${company.razao_social.toLowerCase().replace(/ /g, '-')}-${company.cnpj}`;
        const companyDetails = await scrapeCompanyData(url, cookies);

        const empresa = new Empresa({
          cnpj: company.cnpj,
          razaoSocial: companyDetails.razaoSocial,
          nomeFantasia: companyDetails.nomeFantasia,
          email: companyDetails.email,
          telefones: companyDetails.telefones,
          dataDeAbertura: companyDetails.data_de_abertura
        });

        try {
          await empresa.save();
          allCompanies.push(empresa);
        } catch (error) {
          if (error.code === 11000) {
            existingCompany = await Empresa.findOne({ cnpj: company.cnpj });
            allCompanies.push(existingCompany);
          } else {
            throw error;
          }
        }
      }

      if (allCompanies.length % 2 === 0) {
        await delay(2000); // Delay a cada 2 empresas processadas
      }
    }

    // Salvando os dados extraídos em um arquivo JSON (opcional)
    fs.writeFileSync('empresas.json', JSON.stringify(allCompanies, null, 2));

    res.json(allCompanies);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar a requisição', details: error.message });
  }
};

const getSavedCompanies = async (req, res) => {
  try {
    const companies = await Empresa.find({});
    res.json(companies);
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    res.status(500).json({ error: 'Erro ao buscar empresas', details: error.message });
  }
};

const getCompaniesCount = async (req, res) => {
  try {
    const count = await Empresa.countDocuments({});
    res.json({ count });
  } catch (error) {
    console.error('Erro ao contar empresas:', error);
    res.status(500).json({ error: 'Erro ao contar empresas', details: error.message });
  }
};

module.exports = { searchAndScrapeCompanies, getSavedCompanies, getCompaniesCount };
