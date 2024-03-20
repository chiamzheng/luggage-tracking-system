// Dynamically set WebSocket server address based on window location
const socketUrl = `ws://luggage-tracking-system.onrender.com`;

// Create a WebSocket connection
const socket = new WebSocket(socketUrl);

socket.onopen = function () {
  console.log('WebSocket Client Connected');
};

socket.onmessage = function (event) {
  console.log('Received: ', event.data);
  //const data = JSON.parse(event.data); // Parse received JSON data
  
  // Ensure proper data types
  const name = data.name; // String
  const flightName = data.flight_name; // String
  const beltNo = parseInt(data.belt_no); // Convert to integer
  const trackingProgress = parseInt(data.tracking_progress); // Convert to integer
  
  // Update DOM elements with received data
  document.getElementById('flightName').textContent = flightName;
  document.getElementById('beltNo').textContent = beltNo;
  document.getElementById('trackingProgress').textContent = trackingProgress + '%';
  if (trackingProgress == 3) {
    document.getElementById('landed').classList.add('completed');
    document.getElementById('unloaded').classList.add('completed');
    document.getElementById('ready').classList.add('completed');
  } 
  if (trackingProgress == 2) {
    document.getElementById('landed').classList.add('completed');
    document.getElementById('unloaded').classList.add('completed');  
    document.getElementById('ready').classList.remove('completed');      
  }
  if (trackingProgress == 1) {
    document.getElementById('landed').classList.add('completed');
    document.getElementById('unloaded').classList.remove('completed');  
    document.getElementById('ready').classList.remove('completed');      
  }
  if (trackingProgress == 0) {
    document.getElementById('landed').classList.remove('completed');
    document.getElementById('unloaded').classList.remove('completed');  
    document.getElementById('ready').classList.remove('completed');  
  }
  
  document.getElementById('name').textContent = 'Hi ' + name;
  
  // Add other DOM updates as needed
};

