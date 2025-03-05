const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  yeshiva: {
    type: String,
    required: true
  },
  shadchan: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  documentFile: {
    filename: String,
    contentType: String,
    data: Buffer
  },
  imageFile: {
    filename: String,
    contentType: String,
    data: Buffer
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Proposal', proposalSchema);