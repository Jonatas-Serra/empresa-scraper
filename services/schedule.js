const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cities = [
  ["FEIRA DE SANTANA", "PAULO AFONSO", "BRUMADO", "GUANAMBI"],
  ["VITORIA DA CONQUISTA", "SANTO ANTONIO DE JESUS", "VALENCA", "ALAGOINHAS"],
  ["CAMAÇARI", "IRECE", "SENHOR DO BONFIM", "JACOBINA"],
  ["JUAZEIRO", "DIAS D'AVILA", "CAMPO FORMOSO", "BARREIRAS"],
  ["LAURO DE FREITAS", "CASA NOVA", "CANDEIAS", "RIBEIRA DO POMBAL"],
  ["PORTO SEGURO", "MATA DE SAO JOAO", "JAGUARARI", "LIVRAMENTO DE NOSSA SENHORA"],
  ["BARREIRAS", "XIQUE-XIQUE", "MACAUBAS", "SANTO AMARO"],
  ["ILHEUS", "VERA CRUZ", "REMANSO", "SAO GONCALO DOS CAMPOS"],
  ["ITABUNA", "JUSSARI", "NOVA VICOSA", "ITACARE"],
  ["EUNAPOLIS", "URUCUCA", "GANDU", "SANTA CRUZ CABRALIA"],
  ["TEIXEIRA DE FREITAS", "PRADO", "BELMONTE", "UBAITABA"],
  ["ITAMARAJU", "IPIAU", "CANAVIEIRAS", "CAMACAN"],
  ["JEQUIE", "BUERAREMA", "UNA", "GANDU"],
  ["SIMOES FILHO", "AMARGOSA", "ITAPETINGA", "CRUZ DAS ALMAS"],
  ["BOM JESUS DA LAPA", "ITABERABA", "EUCLIDES DA CUNHA", "CONCEICAO DO COITE"],
  ["SEABRA", "JAGUARARI", "MONTE SANTO", "ARACI"],
  ["SENTO SE", "SANTA MARIA DA VITORIA", "ENTRE RIOS", "CIPO"],
  ["RIO REAL", "RIBEIRA DO POMBAL", "JEREMOABO", "SANTA BARBARA"],
  ["VALENTE", "CICERO DANTAS", "SERRINHA", "RIBEIRA DO AMPARO"],
  ["AMERICA DOURADA", "LAPAO", "IRECE", "CENTRAL"],
  ["JOAO DOURADO", "JUAZEIRO", "REMEDIOS", "UPABA"],
  ["PLANALTINO", "MUTUIPE", "SANTA INES", "MILAGRES"],
  ["MARACAS", "IPIAU", "AIQUARA", "ITAGI"],
  ["JEQUIE", "LAFAYETE COUTINHO", "MANOEL VITORINO", "PLANALTINO"],
  ["UBATA", "UBATAN", "GONGOGI", "DARIO MEIRA"],
  ["IBIRATAIA", "ITAGIBA", "MARAU", "CAMAMU"],
  ["BARRA DO MENDES", "BONINAL", "BROTAS DE MACAUBAS", "CAMPOS BELOS"],
  ["LENCOIS", "PALMEIRAS", "IBICOARA", "ANDARAI"],
  ["MUCUGE", "SEABRA", "PIATA", "ABAIRA"],
  ["BONITO", "IBITUPA", "ITUACU", "PIRIPIRI"],
  ["BARRA DA ESTIVA", "MALHADA DE PEDRAS", "ARACATU", "TANHAÇU"],
  ["BRUMADO", "CONTENDAS DO SINCORA", "CARAIBAS", "TREMENDAL"],
  ["CACULE", "LICINIO DE ALMEIDA", "PINDURAMA", "MALHADA"],
  ["GUANAMBI", "PALMAS DE MONTE ALTO", "MATINA", "IGAPORA"],
  ["CAETITE", "TANQUE NOVO", "BOTUPORA", "CERAIMA"],
  ["MORTUGABA", "JACARACI", "PINDAI", "URANDI"],
  ["MONTE AZUL", "ITUAÇU", "PIATA", "IBITIARA"],
  ["MUCUGE", "IRAQUARA", "NOVA REDENCAO", "IBOTIRAMA"],
  ["BURITIRAMA", "XIQUE-XIQUE", "MORRO DO CHAPEU", "CENTRAL"],
  ["IACU", "ITABERABA", "MUTUIPE", "JAGUARARI"],
  ["PIRIPA", "CANDIBA", "CAETITE", "LICINIO DE ALMEIDA", "SALVADOR"]
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
    const cookies = ["cf_clearance=iRVDtQQPlPjL.mllkriV4Pi7ZJqoVDeDiSvRokJfvxs-1720125706-1.0.1.1-g3iuWo4x8O.E.ikDAwP2drxmK0KDtTlul3m5axaRiaCBAqLolEkWOjwG.912KW3cEXkJ4bPrL5KduNYVeuYlQg"];
    const response = await axios.post('http://localhost:3333/scrape/search-and-scrape-companies', {
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
  const twoDays = 2 * 24 * 60 * 60 * 1000;
  let { date, cityIndex, cityGroupIndex } = getLastProcessed();
  let currentDate = new Date(date);

  while (currentDate <= new Date("2024-07-09")) {
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
    currentDate = new Date(currentDate.getTime() + twoDays);
  }
};

setTimeout(() => {
  cron.schedule(`0 5,11,15,18,21 * * *`, () => {
    scheduleFetchCompanies();
  });
}, 5000);

module.exports = scheduleFetchCompanies;
