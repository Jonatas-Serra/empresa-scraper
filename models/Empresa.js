const mongoose = require('mongoose');

const EmpresaSchema = new mongoose.Schema({
  cnpj: { type: String, unique: true, required: true },
  razaoSocial: { type: String, required: true },
  nomeFantasia: { type: String, required: true },
  email: { type: String },
  telefones: [String],
  dataAbertura: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Empresa', EmpresaSchema);
