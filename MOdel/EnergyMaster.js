const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const modbusDataSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  MeterName: {type: String},
  Make: {type: String},
  Model: {type: String},
  SRNo: {type: Number},
  category: {type: String},
  AvgConsumption: {type: Number},
  MaxCunsumption: {type: String},
  KWHRatimg: {type: String},
});

module.exports = mongoose.model('EnergyMaster', modbusDataSchema);