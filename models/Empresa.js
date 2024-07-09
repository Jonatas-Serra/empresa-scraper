const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({
  cnpj: { type: String, unique: true },
  razaoSocial: String,
  nomeFantasia: String,
  email: String,
  telefones: [String],
  dataDeAbertura: String
});

const Empresa = mongoose.model('Empresa', empresaSchema);

module.exports = Empresa;
