const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cities = [
  ["PORTO SEGURO", "BELMONTE"],
  ["EUNAPOLIS", "SANTA CRUZ CABRALIA"],
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
