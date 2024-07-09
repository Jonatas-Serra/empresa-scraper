const axios = require('axios');
const cheerio = require('cheerio');

const fetchCompanies = async (query, cookies) => {
  const response = await axios.post('https://api.casadosdados.com.br/v2/public/cnpj/search', query, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': cookies.join('; ')
    }
  });
  return response.data;
};

const scrapeCompanyData = async (url, cookies) => {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Cookie': cookies.join('; ')
    }
  });

  const $ = cheerio.load(response.data);

  const cnpj = $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(2) > p').text().trim();
  const razaoSocial = $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(3) > p').text().trim();
  const nomeFantasia = $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(4) > p').text().trim();
  const email = $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(19) > p > a').text().trim();
  const telefones = [
    $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(20) > p > a').text().trim(),
    $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(20) > p:nth-child(3) > a').text().trim()
  ].filter(Boolean);
  const dataAbertura = $('#__nuxt > div > section:nth-child(5) > div:nth-child(2) > div.column.is-7.is-offset-2 > div > div:nth-child(23) > div > p').text().trim();

  return { cnpj, razaoSocial, nomeFantasia, email, telefones, dataAbertura };
};

module.exports = { fetchCompanies, scrapeCompanyData };
