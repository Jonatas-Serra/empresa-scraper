const axios = require('axios');
const cheerio = require('cheerio');

const scrapeCompanyData = async (url, cookies) => {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0',
      'Cookie': cookies.join('; ')
    }
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

module.exports = scrapeCompanyData;
