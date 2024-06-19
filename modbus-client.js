// const Modbus = require('jsmodbus');
// const net = require('net');

// // TCP connection parameters
// const options = {
//   host: '192.168.3.40', // Replace with your Modbus server IP
//   port: 502 // Replace with your Modbus server port if different
// };

// // Create a socket
// const socket = new net.Socket();
// const client = new Modbus.client.TCP(socket);

// // Connect to the Modbus server
// socket.connect(options);

// socket.on('connect', () => {
//   console.log('Connected to Modbus server');

//   // Read holding registers starting at address 0, read 10 registers
//   client.readHoldingRegisters(800, 5)
//     .then(response => {
//       console.log('Holding Registers:', response.response._body.valuesAsArray);
//       socket.end();
//     })
//     .catch(error => {
//       console.error('Error reading holding registers:', error);
//       socket.end();
//     });
// });

// socket.on('error', error => {
//   console.error('Socket Error:', error);
// });

// socket.on('close', () => {
//   console.log('Connection closed');
// });


const ModbusRTU = require('modbus-serial');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const port = 4000;

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Create an instance of Modbus client
const client = new ModbusRTU();

// Connect to the Modbus server via TCP
const ipAddress = '192.168.3.40'; // Replace with your Modbus device IP address
const portNumber = 502; // Default Modbus TCP port is 502

let modbusData = []; // Variable to store the latest Modbus data

client.connectTCP(ipAddress, { port: portNumber })
    .then(setClient)
    .then(function() {
        console.log(`Modbus connected to ${ipAddress}:${portNumber}`);
        startPolling();
    })
    .catch(function(e) {
        console.log(e);
    });

// Function to set client parameters after connection
function setClient() {
    client.setID(1); // Set the Modbus slave ID (adjust as needed)
    client.setTimeout(1000);
}

// Function to start polling the Modbus device
function startPolling() {
    setInterval(async () => {
        try {
            // Read holding registers (adjust address and length as needed)
            const data = await client.readHoldingRegisters(800, 10);
            modbusData = data.data; // Update the latest data
            console.log('Modbus Data:', modbusData); // Display data in console

            // Send the updated data to all connected WebSocket clients
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(modbusData));
                }
            });
        } catch (error) {
            console.error('Error reading Modbus data:', error.message);
        }
    }, 5000); // Poll every 5 seconds (adjust the interval as needed)
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to get data from Modbus
app.get('/modbus-data', (req, res) => {
    res.json(modbusData);
});

// Start the HTTP server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
