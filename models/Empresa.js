const mongoose = require('mongoose');

const EmpresaSchema = new mongoose.Schema({
  EmpresaMEI: String,
  cnpj: { type: String, unique: true, required: true },
  razaoSocial: String,
  nomeFantasia: String,
  dataDeAbertura: String,
  naturezaJuridica: String,
  municipio: String,
  estado: String,
  cnaePrincipal: String,
  cnaesSecundarios: [String],
  email: String,
  telefones: [String]
});

module.exports = mongoose.model('Empresa', EmpresaSchema);