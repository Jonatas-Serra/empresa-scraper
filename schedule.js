const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cities = [
  ["ITABUNA", "JUSSARI", "NOVA VICOSA", "ITACARE"],
  ["ILHEUS", "BUERAREMA", "CAMACAN", "BELMONTE"],
  ["TEIXEIRA DE FREITAS", "PRADO", "SANTA CRUZ CABRALIA", "UBAITABA"],
  ["EUNAPOLIS", "URUCUCA", "GANDU", "UNA"],
  ["PORTO SEGURO", "ITAMARAJU", "IPIAU", "CANAVIEIRAS"],
  ["VALENCA", "UN", "VALENCA", "IPIAU"],
  ["JEQUIE", "GANDU", "UNA", "SANTA CRUZ CABRALIA"],
  ["ITAPETINGA", "GANDU", "BUERAREMA", "JUSSARI"]
];

const getLastProcessed = () => {
  if (fs.existsSync('lastProcessed.json')) {
    const data = fs.readFileSync('lastProcessed.json');
    return JSON.parse(data);
  }
  return { date: "2023-01-01", cityIndex: 0 };
};

const saveLastProcessed = (date, cityIndex) => {
  const data = { date, cityIndex };
  fs.writeFileSync('lastProcessed.json', JSON.stringify(data));
};

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
  const twodays = 48 * 60 * 60 * 1000;
  let { date, cityIndex } = getLastProcessed();
  let currentDate = new Date(date);

  while (currentDate <= new Date("2024-07-09")) {
    const formattedDate = currentDate.toISOString().split('T')[0];
    for (; cityIndex < cities.length; cityIndex++) {
      await fetchAndSaveCompaniesForCity(cities[cityIndex], formattedDate);
      saveLastProcessed(formattedDate, cityIndex);
      await delay(10000); // Delay de 10 segundos entre cidades
    }
    cityIndex = 0; // Reset city index after a day is processed
    currentDate = new Date(currentDate.getTime() + twodays);
  }
};

setTimeout(() => {
  cron.schedule(`0 5,11,15,18,21 * * *`, () => {
    scheduleFetchCompanies();
  });
}, 5000);

module.exports = scheduleFetchCompanies;
