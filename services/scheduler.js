const cron = require('node-cron');
const axios = require('axios');

const scheduleFetchCompanies = () => {
  const cities = [
    "PORTO SEGURO", "EUNAPOLIS", "SANTA CRUZ CABRALIA", "ITABELA", "ITAMARAJU",
    "GUARATINGA", "BELMONTE", "NOVA VICOSA", "MUCURI", "TEIXEIRA DE FREITAS",
    "ALCINOPOLIS", "ITAGIMIRIM", "CAMACAN", "UNA", "CANAVIEIRAS", "ILHEUS",
    "VITORIA DA CONQUISTA", "ITAPETINGA", "ITORORO", "PAU BRASIL", "ITAPEBI",
    "PRADO", "LACERDA", "MASCOTE", "JUCURUCU", "IPUPIARA"
  ];

  const fetchAndSaveCompaniesForCity = async (city) => {
    try {
      const cookies = [process.env.COOKIE];
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.post('http://localhost:3333/api/search-and-scrape-companies', {
        startDate: today,
        endDate: today,
        cookies: cookies,
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
      console.log(`Empresas salvas para ${city}:`, response.data);
    } catch (error) {
      console.error(`Erro ao buscar empresas para ${city}:`, error);
    }
  };

  cities.forEach((city, index) => {
    cron.schedule(`0 5,11,15,18,21 * * *`, () => {
      setTimeout(() => fetchAndSaveCompaniesForCity(city), index * 10000);
    });
  });
};

module.exports = scheduleFetchCompanies;
