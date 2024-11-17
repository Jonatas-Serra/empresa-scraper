const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cities = [
  ["SALVADOR"],
  ["FEIRA DE SANTANA"],
  ["LAURO DE FREITAS"],
  ["VITORIA DA CONQUISTA", "ITAPETINGA", "JAGUAQUARA"],
  ["CAMACARI", "SERRINHA", "IBICUI"],
  ["JUAZEIRO", "PILAO ARCADO", "REMANSO"],
  ["ITABUNA", "ITAJU DO COLONIA", "ITAPE"],
  ["ILHEUS", "URUCUCA", "ITACARE"],
  ["JEQUIE", "JITAUNA", "MARACAS"],
  ["ALAGOINHAS", "PIRAI DO NORTE", "ITUBERA"],
  ["BARREIRAS", "SANTA RITA DE CASSIA", "FORMOSA DO RIO PRETO"],
  ["PORTO SEGURO", "EUNAPOLIS", "SANTA CRUZ CABRALIA"],
  ["ITABELA", "GUARATINGA", "MONTE PASCOAL"],
  ["PAULO AFONSO", "GLORIA", "SANTA BRIGIDA"],
  ["SANTO ANTONIO DE JESUS", "NAZARE", "SAO FELIPE"],
  ["VALENCA", "TAPEROA", "NILO PECANHA"],
  ["SIMOES FILHO", "CANDEIAS", "MADRE DE DEUS"],
  ["TEIXEIRA DE FREITAS", "MEDEIROS NETO", "PRADO"],
  ["BARREIRAS", "LUIS EDUARDO MAGALHAES", "RIACHAO DAS NEVES"],
  ["IBIRAPITANGA", "UBATÃ", "GONGOGI"],
  ["MURITIBA", "CRUZ DAS ALMAS", "SANTO AMARO"],
  ["LAJEDO DO TABOCAL", "IPIAU", "JAGUARARI"],
  ["RIO REAL", "CONDE", "ESPLANADA"],
  ["IBIRAPUA", "CARAVELAS", "NOVA VIÇOSA"],
  ["BRUMADO", "CAETITE", "GUANAMBI"],
  ["SEABRA", "LENCOIS", "PALMEIRAS"],
  ["XIQUE-XIQUE", "IBOTIRAMA", "BROTAS DE MACAUBAS"],
  ["BONINAL", "PIATA", "ABAIRA"],
  ["SENHOR DO BONFIM", "PONTO NOVO", "CAMPO FORMOSO"],
  ["MONTE SANTO", "QUIXABEIRA", "CAPIM GROSSO"],
  ["JACOBINA", "SERROLANDIA", "OUROLANDIA"],
  ["ITAQUARA", "AMARGOSA", "SAO MIGUEL DAS MATAS"],
  ["TANQUINHO", "SANTALUZ", "ARACI"],
  ["UNA", "CANAVIEIRAS", "SANTA LUZIA"],
  ["IBICARAI", "FIRMINO ALVES", "FLORESTA AZUL"],
  ["ITIRUCU", "LAFAIETE COUTINHO", "PLANALTINO"],
  ["SALINAS DA MARGARIDA", "ITAPARICA", "VERA CRUZ"],
  ["MAIRI", "MUNDO NOVO", "PIATA"],
  ["URANDI", "LICINIO DE ALMEIDA", "CACULE"],
  ["PIRIPA", "IBIPITANGA", "MACAUBAS"]
];

const getLastProcessed = () => {
  if (fs.existsSync('lastProcessed.json')) {
    const data = fs.readFileSync('lastProcessed.json');
    return JSON.parse(data);
  }
  return { date: "2023-01-01", cityIndex: 0, cityGroupIndex: 0 };
};

const saveLastProcessed = (date, cityGroupIndex, cityIndex) => {
  const data = { date, cityGroupIndex, cityIndex };
  fs.writeFileSync('lastProcessed.json', JSON.stringify(data));
};

const fetchAndSaveCompaniesForCity = async (city, date) => {
  try {
    const cookies = [process.env.COOKIE];
    const response = await axios.post('https://empresa-scraper-1.onrender.com/scrape/search-and-scrape-companies', {
      startDate: date,
      endDate: date,
      cookies: cookies,
      city: city
    });
    console.log(`Empresas salvas para ${city} em ${date}:`, response.data);
  } catch (error) {
    console.error(`Erro ao buscar empresas para ${city} em ${date}:`, error);
  }
};

const scheduleFetchCompanies = async () => {
  const fiveDays = 5 * 24 * 60 * 60 * 1000;
  let { date, cityIndex, cityGroupIndex } = getLastProcessed();
  let currentDate = new Date(date);

  while (currentDate <= new Date("2024-11-16")) {
    const formattedDate = currentDate.toISOString().split('T')[0];
    for (; cityGroupIndex < cities.length; cityGroupIndex++) {
      for (; cityIndex < cities[cityGroupIndex].length; cityIndex++) {
        await fetchAndSaveCompaniesForCity(cities[cityGroupIndex][cityIndex], formattedDate);
        saveLastProcessed(formattedDate, cityGroupIndex, cityIndex);
        await delay(10000); // Delay de 10 segundos entre cidades
      }
      cityIndex = 0; // Reset city index after a group is processed
    }
    cityGroupIndex = 0; // Reset city group index after two days are processed
    currentDate = new Date(currentDate.getTime() + fiveDays);
  }
};

setTimeout(() => {
  cron.schedule(`0 5,11,15,18,21 * * *`, () => {
    scheduleFetchCompanies();
  });
}, 5000);

module.exports = scheduleFetchCompanies;
