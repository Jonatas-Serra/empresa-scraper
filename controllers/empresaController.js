const axios = require('axios');
const cheerio = require('cheerio');
const fetchCompanies = require('../services/fetchCompanies');
const Empresa = require('../models/Empresa');
const fs = require('fs');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let requestCount = 0;

const retryFetch = async (fetchFunction, args, maxRetries = 5, delayMs = 2000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      requestCount++;
      return await fetchFunction(...args);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.warn(`Received 429 Too Many Requests. Retrying attempt ${attempt + 1} of ${maxRetries}...`);
        console.log(`Total requests made before 429: ${requestCount}`);
        await delay(delayMs);
        attempt++;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
};

const scrapeCompanyData = async (url, cookies) => {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0',
      'Cookie': cookies.join('; ')
    },
  });

  const $ = cheerio.load(response.data);

  const companyDetails = {
    cnpj: $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(2) > p').text().trim() || 'Não encontrado',
    razaoSocial: $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(3) > p').text().trim() || 'Não encontrado',
    nomeFantasia: $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(4) > p').text().trim() || 'Não encontrado',
    data_de_abertura: $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(6) > p > a').text().trim() || 'Não encontrado',
    email: $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(19) > p > a').text().trim() || 'Não encontrado',
    telefones: [
      $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(20) > p > a').text().trim(),
      $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(20) > p:nth-child(3) > a').text().trim()
    ].filter(t => t)
  };

  return companyDetails;
};

const formatUrl = (razaoSocial, cnpj) => {
  return `https://casadosdados.com.br/solucao/cnpj/${razaoSocial.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and').replace(/---/g, '-').replace(/[()]/g, '').replace(/[^\w-]/g, '')}-${cnpj}`;
};

const searchAndScrapeCompanies = async (req, res) => {
  const { startDate, endDate, cookies } = req.body;

  const query = {
    "query": {
      "termo": [],
      "atividade_principal": [],
      "natureza_juridica": [],
      "uf": ["BA"],
      "municipio": ["SALVADOR"],
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
      "somente_mei": false,
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
    const initialData = await retryFetch(fetchCompanies, [query, cookies]);

    if (initialData.error) {
      console.error('Erro na resposta da API:', initialData.content);
      throw new Error('Resposta inesperada da API');
    }

    if (!initialData || !initialData.data) {
      throw new Error('Resposta inesperada da API');
    }

    const totalCompanies = initialData.data.count;
    console.log(`Total de empresas encontradas: ${totalCompanies}`);
    const totalPages = Math.ceil(totalCompanies / 20);

    let allCompanies = [];

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      query.page = currentPage;
      const pageData = await retryFetch(fetchCompanies, [query, cookies]);

      if (pageData.error) {
        console.error('Erro na resposta da API na página', currentPage, ':', pageData.content);
        throw new Error(`Resposta inesperada da API na página ${currentPage}`);
      }

      if (!pageData || !pageData.data) {
        throw new Error(`Resposta inesperada da API na página ${currentPage}`);
      }

      await processAndSaveCompanies(pageData.data.cnpj, cookies, allCompanies);

      if (currentPage % 2 === 0) {
        await delay(5000);
      }
    }

    res.json(allCompanies);

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar a requisição', details: error.message });
  }
};

const processAndSaveCompanies = async (companyData, cookies, allCompanies) => {
  // Verificar CNPJs que já existem no banco de dados
  const existingCNPJs = await Empresa.find({ cnpj: { $in: companyData.map(company => company.cnpj) } }).select('cnpj');
  const existingCNPJSet = new Set(existingCNPJs.map(company => company.cnpj));

  const newCompanies = companyData.filter(company => !existingCNPJSet.has(company.cnpj));

  for (let i = 0; i < newCompanies.length; i += 5) {
    const companiesBatch = newCompanies.slice(i, i + 5);

    const scrapePromises = companiesBatch.map(async (company) => {
      try {
        const url = formatUrl(company.razao_social, company.cnpj);
        const companyDetails = await retryFetch(scrapeCompanyData, [url, cookies]);

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
          return empresa;
        } catch (error) {
          if (error.code === 11000) {
            const existingEmpresa = await Empresa.findOne({ cnpj: company.cnpj });
            allCompanies.push(existingEmpresa);
            return existingEmpresa;
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error(`Erro ao processar CNPJ ${company.cnpj}:`, error);
        return null;  // Retorna null para empresas que deram erro
      }
    });

    await Promise.all(scrapePromises);

    // Aguardar 2 segundos após cada 5 empresas
    await delay(2000);
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