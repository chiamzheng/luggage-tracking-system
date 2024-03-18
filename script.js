// Dynamically set WebSocket server address based on window location
const socketUrl = `ws://${window.location.hostname}:${window.location.port}`;

// Create a WebSocket connection
const socket = new WebSocket(socketUrl);

socket.onopen = function () {
  console.log('WebSocket Client Connected');
};

socket.onmessage = function (event) {
  console.log('Received: ', event.data);
  const data = JSON.parse(event.data); // Assuming data is sent as JSON

  // Update DOM elements with received data
  document.getElementById('passengerName').textContent = 'Hi ' + data.name;
  document.getElementById('flightName').textContent = data.flight_name;
  document.getElementById('beltNo').textContent = data.belt_no;
  document.getElementById('trackingProgress').textContent = data.tracking_progress + '%';
};


