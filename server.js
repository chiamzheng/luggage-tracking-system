const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); 
const app = express();
const MongoClient = require('mongodb').MongoClient;
const mongoURI = 'mongodb://localhost:27017/';
const dbName = 'luggageprioritydb';
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB using MongoClient
MongoClient.connect(mongoURI)
  .then(client => {
    console.log('Connected to MongoDB');
    const db = client.db(dbName);


    app.get('/', (req, res) => {
      res.send('Welcome to Flight Tracking App, please use the provided QR code'); // Send a welcome message or render a homepage HTML here
    });


    app.get('/:passengerId', async (req, res) => {//extract id and display information from db
        try {
          const passengerId = parseInt(req.params.passengerId, 10); // Parse as base-10 integer
          const passengerInfoCollection = db.collection('passenger_info');
          const flightInfoCollection = db.collection('flight_info');
      
          const passengerInfo = await passengerInfoCollection.findOne({ passenger_id: passengerId });
          if (!passengerInfo) {
            return res.status(404).send('Passenger not found');
          }
      
          const { flight_id, priority_q } = passengerInfo;
          let trackingType = priority_q ? 'priority_track' : 'norm_track'; // choose which tracking to follow
      
          const flightInfo = await flightInfoCollection.findOne({ flight_id });
          if (!flightInfo) {
            return res.status(404).send('Flight not found');
          }
      
          const { belt_no, [trackingType]: tracking_progress,flight_name } = flightInfo;

          // Generate HTML content
          const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Flight Tracking</title>
              <link rel="stylesheet" href="styles.css">
              <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
              <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
            </head>
            <body>
              <div class="container">
                <h1>Flight Information</h1>
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
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });

