// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const modbusDataSchema = new Schema({
//   timestamp: { type: Date, default: Date.now },
//   data: { type: [Number], required: true },
// });

// module.exports = mongoose.model('ModbusData', modbusDataSchema);

const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define the schema for Modbus data
const ModbusDataSchema = new Schema({
    timestamp: { type: Date, default: Date.now },
    data: {
        Frequency: Number,
        PhaseVoltage1: Number,
        PhaseVoltage2: Number,
        PhaseVoltage3: Number,
        AveragePhaseVoltage: Number,
        LineVoltageV12: Number,
        LineVoltageV23: Number,
        LineVoltageV31: Number,
        AverageLineVoltage: Number,
        CurrentA1: Number
    }
});

// Export the model
module.exports = mongoose.model('ModbusData', ModbusDataSchema);
