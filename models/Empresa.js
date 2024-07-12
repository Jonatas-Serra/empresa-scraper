const mongoose = require('mongoose');

const EmpresaSchema = new mongoose.Schema({
  cnpj: { type: String, unique: true, required: true },
  razaoSocial: String,
  nomeFantasia: String,
  dataDeAbertura: String,
  naturezaJuridica: String,
  municipio: String,
  estado: String,
  cnaePrincipal: String,
  cnaesSecundarios: [String],
  empresaMEI: String,
  email: String,
  telefones: [String]
});

module.exports = mongoose.model('Empresa', EmpresaSchema);
