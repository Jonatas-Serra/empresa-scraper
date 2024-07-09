const express = require('express');
const connectDB = require('./config/db');
const empresaRoutes = require('./routes/empresaRoutes');
const scheduleFetchCompanies = require('./schedule');
require('dotenv').config();

const app = express();

connectDB();

app.use(express.json());
app.use('/scrape', empresaRoutes);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  scheduleFetchCompanies(); // Inicia o agendamento das tarefas
});
