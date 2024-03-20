// Dynamically set WebSocket server address based on window location

const socketUrl = 'wss://luggage-tracking-system.onrender.com'; // specifically for render


// Create a WebSocket connection
const socket = new WebSocket(socketUrl);

socket.onopen = function () {
  console.log('WebSocket Client Connected');
};

socket.onmessage = function (event) {
  console.log('Received: ', event.data);

  
  const data = JSON.parse(event.data); // Parse received JSON data
  
  // Ensure proper data types
  const name = data.name; // String
  const flightName = data.flight_name; // String
  const beltNo = parseInt(data.belt_no); // Convert to integer
  const trackingProgress = parseInt(data.tracking_progress); // Convert to integer
  const updatetime =  data.updatetime;
  
  // Update DOM elements with received data
  document.getElementById('flightName').textContent = flightName;
  document.getElementById('beltNo').textContent = beltNo;
  document.getElementById('landedtime').textContent = new Date( updatetime[1]);
  document.getElementById('unloadtime').textContent = new Date(updatetime[2]);
  document.getElementById('collecttime').textContent = new Date(updatetime[3]);
  if (trackingProgress == 3) {
    document.getElementById('landed').classList.add('completed');
    document.getElementById('unloaded').classList.add('completed');
    document.getElementById('ready').classList.add('completed');
    document.getElementById('landedtime').style.display = 'block';
    document.getElementById('unloadtime').style.display = 'block';
    document.getElementById('collecttime').style.display = 'block'; 
  } 
  if (trackingProgress == 2) {
    document.getElementById('landed').classList.add('completed');
    document.getElementById('unloaded').classList.add('completed');  
    document.getElementById('ready').classList.remove('completed');   
    document.getElementById('landedtime').style.display = 'block';
    document.getElementById('unloadtime').style.display = 'block';
    document.getElementById('collecttime').style.display = 'none';    
  }
  if (trackingProgress == 1) {
    document.getElementById('landed').classList.add('completed');
    document.getElementById('unloaded').classList.remove('completed');  
    document.getElementById('ready').classList.remove('completed');
    document.getElementById('landedtime').style.display = 'block';
    document.getElementById('unloadtime').style.display = 'none';
    document.getElementById('collecttime').style.display = 'none';      
  }
  if (trackingProgress == 0) {
    document.getElementById('landed').classList.remove('completed');
    document.getElementById('unloaded').classList.remove('completed');  
    document.getElementById('ready').classList.remove('completed'); 
    document.getElementById('landedtime').style.display = 'none';
    document.getElementById('unloadtime').style.display = 'none';
    document.getElementById('collecttime').style.display = 'none';
  }
  
  document.getElementById('name').innerHTML = `<strong>${name}</strong>`;

  
  // Add other DOM updates as needed
};

