// const ModbusRTU = require('modbus-serial');
// const express = require('express');
// const mongoose = require('mongoose');
// const http = require('http');
// const WebSocket = require('ws');
// const path = require('path');
// const bodyParser = require('body-parser');
// const cors = require('cors'); // Import the cors middleware
// // const ModbusData = require("./MOdel/ModbusData")


// // Import the ModbusData model
// const ModbusData = require('./MOdel/ModbusData');
// const EnergyMaster = require('./MOdel/EnergyMaster');
// const app = express();
// const port = 4000;

// app.use(cors());

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/modbus', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', () => {
//   console.log('Connected to MongoDB');
// });

// // Create HTTP server and WebSocket server
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });

// // Create an instance of Modbus clien
// const client = new ModbusRTU();

// // Connect to the Modbus server via TCP
// const ipAddress = '192.168.3.40'; // Replace with your Modbus device IP address
// const portNumber = 502; // Default Modbus TCP port is 502

// let modbusData = []; // Variable to store the latest Modbus data

// client.connectTCP(ipAddress, { port: portNumber })
//     .then(setClient)
//     .then(function() {
//         console.log(`Modbus connected to ${ipAddress}:${portNumber}`);
//         startPolling();
//     })
//     .catch(function(e) {
//         console.log(e);
//     });

// // Function to set client parameters after connection
// function setClient() {
//     client.setID(1); // Set the Modbus slave ID (adjust as needed)
//     client.setTimeout(1000);
// }

// // Function to start polling the Modbus device
// function startPolling() {
//     setInterval(async () => {
//         try {
//             // Read holding registers (adjust address and length as needed)
//             const data = await client.readHoldingRegisters(800, 10);
//             modbusData = data.data; // Update the latest data
//             console.log('Modbus Data:', modbusData); // Display data in console

//              // Save data to MongoDB
//              const modbusDataDocument = new ModbusData({ data: modbusData });
//              await modbusDataDocument.save();

//             // Send the updated data to all connected WebSocket clients
//             wss.clients.forEach(client => {
//                 if (client.readyState === WebSocket.OPEN) {
//                     client.send(JSON.stringify(modbusData));
//                 }
//             });
//         } catch (error) {
//             console.error('Error reading Modbus data:', error.message);
//         }
//     }, 10000); // Poll every 5 seconds (adjust the interval as needed)
// }

// // Middleware to parse JSON bodies
// app.use(bodyParser.json());

// // Serve static files from the 'public' directory
// app.use(express.static(path.join(__dirname, 'public')));

// // Endpoint to get data from Modbus
// app.get('/modbus-data', async (req, res) => {
//     // res.json(modbusData);
//     try{
//         const getdata = await ModbusData.find().sort({_id : -1}).limit(1)
//         res.json(getdata)   
//     }catch(err){
//         console.log(err)
//     }
// });

// // Endpoint to write data to Modbus
// app.post('/modbus-write', async (req, res) => {
//     const { address, values } = req.body;
//     try {
//         // Log the received data for debugging
//         console.log('Received data to write:', { address, values });

//         // Write multiple registers (adjust address as needed)
//         await client.writeRegisters(address, values);

//         // Update modbusData with the new values
//         modbusData = modbusData.map((val, index) =>
//             (index >= address - 800 && index < address - 800 + values.length) 
//                 ? values[index - (address - 800)] 
//                 : val
//         );

//         // Notify all WebSocket clients of the update
//         wss.clients.forEach(client => {
//             if (client.readyState === WebSocket.OPEN) {
//                 client.send(JSON.stringify(modbusData));
//             }
//         });

//         res.json({ success: true, message: 'Data written to PLC successfully' });
//     } catch (error) {
//         console.error('Error writing to Modbus:', error.message);
//         res.status(500).json({ success: false, message: error.message });
//     }
// });


// // Start the HTTP server
// server.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });



const ModbusRTU = require('modbus-serial');
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import the ModbusData model
// const ModbusData = require('./models/ModbusData'); // Adjust the path if necessary
const ModbusData = require("./MOdel/ModbusData")

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const modbusTCPSettings = {
    ip: '192.168.3.40', // Replace with your Modbus device IP address
    port: 502,          // Default Modbus TCP port
    slaveID: 1,
    pollingInterval: 10000 // Poll every 10 seconds
};

const registerKeys = [
    'Frequency', 'PhaseVoltage1', 'PhaseVoltage2', 'PhaseVoltage3', 
    'AveragePhaseVoltage', 'LineVoltageV12', 'LineVoltageV23', 'LineVoltageV31', 
    'AverageLineVoltage', 'CurrentA1'
];

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/modbus', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let modbusData = {}; // Variable to store the latest Modbus data

// Initialize Modbus client and connect
const client = new ModbusRTU();
client.connectTCP(modbusTCPSettings.ip, { port: modbusTCPSettings.port })
    .then(() => {
        client.setID(modbusTCPSettings.slaveID);
        client.setTimeout(1000);
        console.log(`Modbus connected to ${modbusTCPSettings.ip}:${modbusTCPSettings.port}`);
        startPolling();
    })
    .catch(err => {
        console.error('Error connecting to Modbus:', err.message);
    });

// Function to poll Modbus device periodically
function startPolling() {
    setInterval(async () => {
        try {
            // Read holding registers
            const data = await client.readHoldingRegisters(800, 10);
            const modbusValues = data.data;

            // Map values to keys
            modbusData = mapValuesToKeys(modbusValues, registerKeys);
            console.log('Modbus Data:', modbusData);

            // Save mapped data to MongoDB
            await saveDataToMongo(modbusData);

            // Send updated data to WebSocket clients
            broadcastWebSocketData(modbusData);
        } catch (error) {
            console.error('Error reading Modbus data:', error.message);
        }
    }, modbusTCPSettings.pollingInterval);
}

// Function to map register values to keys
function mapValuesToKeys(values, keys) {
    const mappedData = {};
    for (let i = 0; i < values.length; i++) {
        mappedData[keys[i]] = values[i];
    }
    return mappedData;
}

// Function to save data to MongoDB
async function saveDataToMongo(data) {
    try {
        const modbusDataDocument = new ModbusData({ data });
        await modbusDataDocument.save();
    } catch (error) {
        console.error('Error saving data to MongoDB:', error.message);
    }
}

// Function to broadcast data to WebSocket clients
function broadcastWebSocketData(data) {
    try {
        const message = JSON.stringify(data);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    } catch (error) {
        console.error('Error broadcasting data to WebSocket clients:', error.message);
    }
}

// API endpoint to get the latest Modbus data
app.get('/modbus-data', async (req, res) => {
    try {
        const latestData = await ModbusData.find().sort({ _id: -1 }).limit(1);
        res.json(latestData[0]?.data || {});
    } catch (err) {
        console.error('Error fetching Modbus data:', err.message);
        res.status(500).json({ success: false, message: 'Error fetching Modbus data' });
    }
});

// API endpoint to write data to Modbus
app.post('/modbus-write', async (req, res) => {
    const { address, values } = req.body;
    try {
        console.log('Received data to write:', { address, values });

        await client.writeRegisters(address, values);

        // Update the in-memory modbusData
        const startIndex = address - 800;
        values.forEach((value, i) => {
            if (startIndex + i < registerKeys.length) {
                modbusData[registerKeys[startIndex + i]] = value;
            }
        });

        broadcastWebSocketData(modbusData);
        res.json({ success: true, message: 'Data written to PLC successfully' });
    } catch (error) {
        console.error('Error writing to Modbus:', error.message);
        res.status(500).json({ success: false, message: 'Error writing to Modbus' });
    }
});

// Start the HTTP server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
