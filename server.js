const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); 
const app = express();
//const MongoClient = require('mongodb').MongoClient;
const Schema = mongoose.Schema;
//const mongoURI = 'mongodb://localhost:27017/';
const mongoURI = 'mongodb+srv://zheng:123@test.ojgb3ty.mongodb.net/?retryWrites=true&w=majority&appName=Test';
const db = 'luggageprioritydb';
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

mongoose.connect(mongoURI,{dbName: db})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
});

app.get('/', (req, res) => {
  res.send('Welcome to Flight Tracking App, please use the provided QR code'); // Send a welcome message or render a homepage HTML here
});


    app.get('/:passengerId', async (req, res) => {//extract id and display information from db
        try {
          const passengerId = parseInt(req.params.passengerId, 10); // Parse as base-10 integer
         // const { passengerId } = req.params;
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
                <h2>Hi ${name}</h2>
                <div id="flightInfo">
                  <p><strong>Flight:</strong> ${flight_name}</p>
                  <p><strong>Belt No:</strong> ${belt_no}</p>
                  <p><strong>Tracking Progress:</strong> ${tracking_progress}%</p>
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

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  

