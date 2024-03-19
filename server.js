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
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const numericPattern = '\\d+';
let x = 0;

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  // Example: Send message to connected clients
  //ws.send(JSON.stringify({ message: 'Connected to WebSocket server' }));

});


app.use(express.static(path.join(__dirname)));


const flightSchema = new Schema({
  flight_id: Number,
  belt_no: Number,
  priority_track: Number,
  norm_track: Number,
  flight_name: String
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
        console.log('x is %d',x);
        const passengerData = await Passenger.findOne({ passenger_id: x });
        if (!passengerData) {
          console.error('Passenger not found');
          return;
          }

        const { flight_id, priority_q ,name} = passengerData;
        const trackingType = priority_q ? 'priority_track' : 'norm_track';

        const flightData = await Flight.findOne({ flight_id });
        if (!flightData) {
          console.error('Flight not found');
          return; // Exit the function since we cannot continue without flight data
        }

        const { belt_no, [trackingType]: tracking_progress, flight_name } = flightData
         

        const dataToSend = {
          name,
          flight_name,
          belt_no,
          tracking_progress
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
  res.send('Welcome to Flight Tracking App, please use the provided QR code'); // landing page
});

app.get('/:passengerId(' + numericPattern + ')', async (req, res) => {//extract id and display information from db
  try {
    const passengerId = parseInt(req.params.passengerId, 10); // Parse as base-10 integer
    console.log('Parsed passengerId:', passengerId); // Add this line for debugging
    if (isNaN(passengerId)) {
      return res.status(400).send('Invalid passenger ID');
    }
   // const { passengerId } = req.params;
    x = passengerId;
    const passengerInfo = await Passenger.findOne({ passenger_id: passengerId });
    

    if (!passengerInfo) {
      return res.status(404).send('Passenger not found');
      }

    const { flight_id, priority_q ,name} = passengerInfo;
    const trackingType = priority_q ? 'priority_track' : 'norm_track';

    const flightInfo = await Flight.findOne({ flight_id });
    if (!flightInfo) {
      return res.status(404).send('Flight not found');
    }

    const { belt_no, [trackingType]: tracking_progress, flight_name } = flightInfo;

    // Generate HTML content
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
        <h1>Flight Information</h1>
        <h2 id="name">Hi ${name}</h2>
        <div id="flightInfo">
          <p><strong>Flight:</strong> <span id="flightName">${flight_name}</span></p>
          <p><strong>Belt No:</strong> <span id="beltNo">${belt_no}</span></p>
          <p><strong>Tracking Progress:</strong> <span id="trackingProgress">${tracking_progress}%</span></p>
        </div>
        <div class="container">
          <div class="row justify-content-between">
            <div class="col-sm-4 order-tracking completed">
              <span class="is-complete"></span>
              <p>Landed<br><span>Mon, June 24</span></p>
            </div>
            <div class="col-sm-4 order-tracking completed">
              <span class="is-complete"></span>
              <p>Luggage Unloaded<br><span>Tue, June 25</span></p>
            </div>
            <div class="col-sm-4 order-tracking">
              <span class="is-complete"></span>
              <p>Ready for collection<br><span>Fri, June 28</span></p>
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







  


  

