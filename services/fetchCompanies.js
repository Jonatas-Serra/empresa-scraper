const axios = require('axios');

const fetchCompanies = async (query, cookies) => {
  const response = await axios.post('https://api.casadosdados.com.br/v2/public/cnpj/search', query, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': 'https://casadosdados.com.br',
      'Referer': 'https://casadosdados.com.br/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0',
      'Cookie': cookies.join('; ')
    }
  });

  if (response.status === 403) {
    throw new Error('Access Forbidden: Your request was blocked by Cloudflare');
  }

  return response.data;
};

module.exports = fetchCompanies;
