const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); 
const app = express();
//const MongoClient = require('mongodb').MongoClient;
const Schema = mongoose.Schema;
//const mongoURI = 'mongodb://localhost:27017/';
const mongoURI = 'mongodb+srv://zheng:123@test.ojgb3ty.mongodb.net/?retryWrites=true&w=majority&appName=Test';
const db = 'luggageprioritydb';
const WebSocket = require('ws');
const http = require('http');
const { time } = require('console');
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const numericPattern = '\\d+';
let globalpid = 0;


wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);

    // Here, the 'message' variable is correctly defined

    try {
      const { flightId, trackType, newState } = JSON.parse(message);
      // Ensure flightId is valid (e.g., numeric) before proceeding
      if (isNaN(flightId)) {
        throw new Error('Invalid Flight ID');
      }
      // Call handleFlightUpdate with the parsed parameters
      handleFlightUpdate(trackType, newState, flightId).then(() => {
        console.log('Update successful');
        // Send a success message to the client if needed
        ws.send(JSON.stringify({ message: 'Update successful' }));
      }).catch(err => {
        console.error('Error updating flight:', err);
        // Send an error message to the client if needed
        ws.send(JSON.stringify({ error: err.message }));
      });
    } catch (error) {
      console.error('Error parsing message:', error);
      // Send an error message to the client if needed
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });
});



app.use(express.static(path.join(__dirname)));


const flightSchema = new Schema({
  flight_id: Number,
  belt_no: Number,
  priority_track: Number,
  norm_track: Number,
  flight_name: String,
  lastupdatednorm: Array,
  lastupdatedpriority: Array
});

const passengerSchema = new Schema({
  passenger_id: Number,
  flight_id: Number,
  priority_q: Boolean,
  name: String
});

const Passenger = mongoose.model('Passenger', passengerSchema,'passenger_info');
const Flight = mongoose.model('Flight', flightSchema,'flight_info');


// Inside setupChangeStreams() function

function setupChangeStreams() {
  const changeStream = Flight.watch([
    {
      $match: {
        $or: [
          { 'updateDescription.updatedFields.priority_track': { $exists: true } },
          { 'updateDescription.updatedFields.norm_track': { $exists: true } }
        ],
      }
    }
  ]);

  changeStream.on('change', async (change) => {
    if (change.operationType === 'update') {
      try {
        console.log('globalpid is %d',globalpid);
        const passengerData = await Passenger.findOne({ passenger_id: globalpid });
        if (!passengerData) {
          console.error('Passenger not found');
          return;
          }

        const { flight_id, priority_q ,name} = passengerData;
        const trackingType = priority_q ? 'priority_track' : 'norm_track';
        const timeType = priority_q ? 'lastupdatedpriority':'lastupdatednorm';
        const flightData = await Flight.findOne({ flight_id });
        if (!flightData) {
          console.error('Flight not found');
          return; // Exit the function since we cannot continue without flight data
        }

        const { belt_no, [trackingType]: tracking_progress, flight_name, [timeType]:updatetime } = flightData
         

        const dataToSend = {
          name,
          flight_name,
          belt_no,
          tracking_progress,
          updatetime
        };

            // Send updated data to all connected WebSocket clients
            wss.clients.forEach(client => {
              client.send(JSON.stringify(dataToSend));
            })
        
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    }
  });
}




mongoose.connect(mongoURI,{dbName: db})
.then(() => {
  console.log('Connected to MongoDB');
  setupChangeStreams();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
});

app.get('/', (req, res) => {
  const htmlContent = `
  
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flight Tracking</title>
    <link rel="stylesheet" href="/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
  </head>
  <body>
    <div class="container">
      <h1>Welcome to Flight Tracking App</h1>
      <p>Please enter your Passenger ID:</p>
      <form id="passengerForm">
        <input type="text" id="passengerId" name="passengerId" placeholder="Enter Passenger ID">
        <button type="submit">Go</button>
      </form>
    </div>
  
    <script src="landingscript.js"></script>
  </body>
  </html>
  

`;
  res.send(htmlContent); // landing page
});

app.get('/:passengerId(' + numericPattern + ')', async (req, res) => {//extract id and display information from db
  try {
    const passengerId = parseInt(req.params.passengerId, 10); // Parse as base-10 integer
    console.log('Parsed passengerId:', passengerId); // Add this line for debugging
    if (isNaN(passengerId)) {
      return res.status(400).send('Invalid passenger ID');
    }
   // const { passengerId } = req.params;
    globalpid = passengerId;
    const passengerInfo = await Passenger.findOne({ passenger_id: passengerId });
    

    if (!passengerInfo) {
      return res.status(404).send('Passenger not found');
      }

    const { flight_id, priority_q ,name} = passengerInfo;
    const trackingType = priority_q ? 'priority_track' : 'norm_track';
    const timeType = priority_q ? 'lastupdatednorm':'lastupdatednorm';
    const flightInfo = await Flight.findOne({ flight_id });
    if (!flightInfo) {
      return res.status(404).send('Flight not found');
    }

    const { belt_no, [trackingType]: tracking_progress, flight_name, [timeType]:updatetime } = flightInfo;

    // Generate HTML content
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Luggage Tracking</title>
      <link rel="stylesheet" href="/styles.css">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
    </head>
    <body>
      <div class="container">
        <h1>Flight Information</h1>
        <h2 id="name">Hi ${name}</h2>
        <div id="flightInfo">
          <p><strong>Flight:</strong> <span id="flightName">${flight_name}</span></p>
          <p><strong>Belt No:</strong> <span id="beltNo">${belt_no}</span></p>
          <p><strong>Tracking Stage:</strong> <span id="trackingProgress">${tracking_progress}</span></p>
        </div>
        <div class="container">
          <div class="row justify-content-between">
            <div id="landed" class="col-sm-4 order-tracking ${tracking_progress >= 1 ? 'completed' : ''}">
              <span class="is-complete"></span>
              <p>Landed<br><span id="landedtime">${updatetime[1]}</span></p>
            </div>
            <div id="unloaded" class="col-sm-4 order-tracking ${tracking_progress >= 2 ? 'completed' : ''}">
              <span class="is-complete"></span>
              <p>Luggage Unloaded<br><span id="unloadtime">${updatetime[2]}</span></p>
            </div>
            <div id="ready" class="col-sm-4 order-tracking ${tracking_progress >= 3 ? 'completed' : ''}">
              <span class="is-complete"></span>
              <p>Ready for collection<br><span id= "collecttime">${updatetime[3]}</span></p>
            </div>
          </div>
        </div>
      </div>
      <script src="script.js"></script>
    </body>
    </html>
    `;

    res.send(htmlContent); // Send the generated HTML as the response
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


app.get('/update', async (req, res) => { // to update tracking 
  try {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Flight Updater</title>
      <link rel="stylesheet" href="/styles.css">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    </head>
    <body>
      <div class="container">
        <h1>Welcome to Flight Updater App</h1>
        <p>Please enter the Flight ID:</p>
        <form id="flightForm">
          <input type="text" id="flightId" name="flightId" placeholder="Enter Flight ID">
          <button type="submit">Go</button>
        </form>
      </div>
    
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const form = document.getElementById('flightForm');
          form.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent the default form submission
    
            const flightIdInput = document.getElementById('flightId');
            const flightId = flightIdInput.value.trim();
    
            // Redirect to the desired URL using template literals
            window.location.href = \`/update/\${flightId}\`;
          });
        });
      </script>
    </body>
    </html>
    `;
    
  res.send(htmlContent); // landing page
    
  }catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


async function handleFlightUpdate(trackType, newState, flightId) {
  try {
    const updateQuery = { flight_id: flightId };
    updatetime = new Date(); // Get current timestamp
    let updateField = {};
    switch (trackType) {
      case 'priority':
        updateField = { priority_track: parseInt(newState),$set: { [`lastupdatedpriority.${parseInt(newState)}`]: updatetime } };
        break;
      case 'normal':
        updateField = { norm_track: parseInt(newState), $set: { [`lastupdatednorm.${parseInt(newState)}`]: updatetime } };
        break;
      default:
        throw new Error('Invalid trackType');
    }
    const updatedFlight = await Flight.findOneAndUpdate(updateQuery, updateField, { new: true });

    if (!updatedFlight) {
      throw new Error('Flight not found to update');
    }
    // Send a message to WebSocket clients about the successful update
    wss.clients.forEach(client => {
      client.send(JSON.stringify({ message: 'Update successful' }));
    });
  } catch (error) {
    throw new Error(error.message);
  }
}


app.get('/update/:flightId(' + numericPattern + ')', async (req, res) => {//extract id and display information from db Luggage tracking updater
try{
  const flightId = parseInt(req.params.flightId, 10); // Parse as base-10 integer
  if (isNaN(flightId)) {
    return res.status(400).send('Invalid Flight ID');
  }
  const flightInfo = await Flight.findOne({ flight_id: flightId });
  if (!flightInfo) {
    return res.status(404).send('Flight not found');
  }
  console.log('Parsed flightId:', flightId); // Add this line for debugging

  

  const { priority_track,norm_track, flight_name} = flightInfo;
  const htmlContent = `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Luggage Updater App</title>
  <!-- Include Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
  <!-- Custom CSS -->
  <style>
    /* Add your custom styles here */
    .btn-custom {
      margin: 5px;
      border: 1px solid #ccc;
      background-color: #fff;
      color: #333;
      cursor: pointer;
      transition: background-color 0.3s, color 0.3s;
    }

    .btn-custom:hover {
      background-color: #f0f0f0;
    }

    .btn-custom.pressed {
      background-color: green;
      color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Luggage Updater App</h1>
    <h2>You are currently updating Flight: ${flight_name} </h2>
    <div class="container p-3 mb-2 bg-primary bg-gradient text-white">Priority Tracker
      <div id="priorityButtons">
        <button class="btn btn-custom priority ${priority_track == 0 ? 'pressed' : ''}" data-state="0" data-track="priority">Reset</button>
        <button class="btn btn-custom priority ${priority_track == 1 ? 'pressed' : ''}" data-state="1" data-track="priority">Landed</button>
        <button class="btn btn-custom priority ${priority_track == 2 ? 'pressed' : ''}" data-state="2" data-track="priority">Unloaded</button>
        <button class="btn btn-custom priority ${priority_track == 3 ? 'pressed' : ''}" data-state="3" data-track="priority">Ready</button>
      </div>
    </div>
    <div class="container p-3 mb-2 bg-secondary bg-gradient text-white">Normal Tracker
      <div id="normalButtons">
        <button class="btn btn-custom normal ${norm_track == 0 ? 'pressed' : ''}" data-state="0" data-track="normal">Reset</button>
        <button class="btn btn-custom normal ${norm_track == 1 ? 'pressed' : ''}" data-state="1" data-track="normal">Landed</button>
        <button class="btn btn-custom normal ${norm_track == 2 ? 'pressed' : ''}" data-state="2" data-track="normal">Unloaded</button>
        <button class="btn btn-custom normal ${norm_track == 3 ? 'pressed' : ''}" data-state="3" data-track="normal">Ready</button>
      </div>
    </div>
  </div>

  <!-- Include Bootstrap JS at the end of the body -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
    function setupWebSocket() {
      const socketUrl = 'ws://localhost:5000'; // Corrected URL format
      const socket = new WebSocket(socketUrl);
    
      socket.addEventListener('open', function (event) {
        console.log('WebSocket Connected');
      });
    
      socket.addEventListener('message', function (event) {
        console.log('Message from server:', event.data);
        const message = JSON.parse(event.data);
        
        // Handle messages from the server
        if (message.message === 'Update successful') {
          // Reload the page after a successful update
          location.reload();
        }
      });
    
      socket.addEventListener('close', function (event) {
        console.log('WebSocket Closed');
      });
    
      socket.addEventListener('error', function (event) {
        console.error('WebSocket Error:', event);
      });
    
      return socket; // Return the socket object for later use
    }
    
    // Call the setupWebSocket function when the page loads
    document.addEventListener('DOMContentLoaded', function () {
      const socket = setupWebSocket();
    
      const buttons = document.querySelectorAll('.btn-custom');
      buttons.forEach(button => {
        button.addEventListener('click', () => {
          const trackType = button.dataset.track;
          const newState = button.getAttribute('data-state');
          const flightId = '${flightId}'; 
    
          const data = { flightId, trackType, newState, type: 'data' };
          socket.send(JSON.stringify(data));
        });
      });
    });
    </script>
    </body>
    </html>
    `;

    res.send(htmlContent);
}catch (err) {
  console.error(err);
  res.status(500).send('Server Error');
}
});

  


  

