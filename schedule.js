const cron = require('node-cron');
const axios = require('axios');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cities = [
  "PORTO SEGURO", "EUNAPOLIS", "SANTA CRUZ CABRALIA", "ITABELA", "ITAMARAJU",
  "GUARATINGA", "BELMONTE", "NOVA VICOSA", "MUCURI", "TEIXEIRA DE FREITAS",
  "ALCINOPOLIS", "ITAGIMIRIM", "CAMACAN", "UNA", "CANAVIEIRAS", "ILHEUS",
  "VITORIA DA CONQUISTA", "ITAPETINGA", "ITORORO", "PAU BRASIL", "ITAPEBI",
  "PRADO", "LACERDA", "MASCOTE", "JUCURUCU", "IPUPIARA"
];

const fetchAndSaveCompaniesForCity = async (city, date) => {
  try {
    const cookies = ["cf_clearance=iRVDtQQPlPjL.mllkriV4Pi7ZJqoVDeDiSvRokJfvxs-1720125706-1.0.1.1-g3iuWo4x8O.E.ikDAwP2drxmK0KDtTlul3m5axaRiaCBAqLolEkWOjwG.912KW3cEXkJ4bPrL5KduNYVeuYlQg"];
    const response = await axios.post('http://localhost:3333/scrape/search-and-scrape-companies', {
      startDate: date,
      endDate: date,
      cookies: cookies,
      city: city,
      query: {
        "query": {
          "uf": ["BA"],
          "municipio": [city],
          "situacao_cadastral": "ATIVA"
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
      }
    });
    console.log(`Empresas salvas para ${city} em ${date}:`, response.data);
  } catch (error) {
    console.error(`Erro ao buscar empresas para ${city} em ${date}:`, error);
  }
};

const scheduleFetchCompanies = async () => {
  const startDate = new Date("2024-01-01");
  const endDate = new Date("2024-07-09");
  const oneDay = 24 * 60 * 60 * 1000;

  for (let date = startDate; date <= endDate; date = new Date(date.getTime() + oneDay)) {
    const formattedDate = date.toISOString().split('T')[0];
    for (const city of cities) {
      await fetchAndSaveCompaniesForCity(city, formattedDate);
      await delay(10000); // Delay de 10 segundos entre cidades
    }
  }
};

setTimeout(() => {
  cron.schedule(`0 5,11,15,18,21 * * *`, () => {
    scheduleFetchCompanies();
  });
}, 5000);

module.exports = scheduleFetchCompanies;
