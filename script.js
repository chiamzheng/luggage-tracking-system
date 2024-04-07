// Dynamically set WebSocket server address based on window location
const socketUrl = `ws://${window.location.hostname}:${window.location.port}`;

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
    const updatetime = data.updatetime;

    // Update DOM elements with received data
    document.getElementById('flightName').textContent = flightName;
    document.getElementById('beltNo').textContent = beltNo;
    document.getElementById('landedtime').textContent = new Date(updatetime[1]);
    document.getElementById('unloadtime').textContent = new Date(updatetime[2]);
    document.getElementById('collecttime').textContent = new Date(updatetime[3]);

    // Check tracking progress and start countdown if necessary
    if (trackingProgress === 3) {
        const collectTime = new Date(updatetime[3]);
        calculateCountdown(collectTime, trackingProgress); // Start the countdown timer with the new collect time and tracking progress
    } else {
        // If tracking progress is not 3, clear any existing countdown timer
        clearInterval(countdownTimer);
        // Hide the button
        document.getElementById('redirectButton').style.display = 'none';
    }

    // Update class and visibility based on tracking progress
    updateTrackingProgress(trackingProgress);
};

let countdownTimer; // Define countdown timer variable globally

const calculateCountdown = (collectTime, trackingProgress) => {
    const countdownDuration = 10; // Countdown duration in seconds
    const finalTime = new Date(collectTime.getTime() + countdownDuration * 1000); // Add countdown duration to collect time
    const countdownDisplay = document.getElementById('countdown');

    // Update countdown display every second
    countdownTimer = setInterval(() => {
        const currentTime = new Date(); // Get the current time
        const remainingTime = Math.floor((finalTime - currentTime) / 1000);

        if (remainingTime >= 0 && trackingProgress === 3) {
            countdownDisplay.innerHTML = `Claim your luggage within ${remainingTime}s to collect points`;
            document.getElementById('redirectButton').style.display = 'block';
        } else {
            clearInterval(countdownTimer);
            countdownDisplay.innerHTML = 'Time is up! You missed out on 400 points! :C';
            document.getElementById('redirectButton').style.display = 'none';
        }
    }, 1000); // Update every 1 second (1000 milliseconds)
};

/*const updateButtonVisibility = (remainingTime) => {
    // Retrieve tracking progress from data attribute
    const countdownDisplay = document.getElementById('countdown');
    const trackingProgress = parseInt(countdownDisplay.dataset.trackingProgress);

    // Check if tracking progress is greater than or equal to 3 and remaining time is greater than 0
    if (trackingProgress == 3 && remainingTime > 0) {
        // Show the button if tracking progress is >= 3 and remaining time is greater than 0
        document.getElementById('redirectButton').style.display = 'block';
    } else {
        // Hide the button if tracking progress is less than 3 or remaining time is less than or equal to 0
        document.getElementById('redirectButton').style.display = 'none';
    }
};*/

// Add an event listener to the button for redirection
document.getElementById('redirectButton').addEventListener('click', () => {
    window.location.href = 'https://auth.changiairport.com/login?lang=en'; // Redirect to the desired website
});



const updateTrackingProgress = (trackingProgress) => {
    const landedElement = document.getElementById('landed');
    const unloadedElement = document.getElementById('unloaded');
    const readyElement = document.getElementById('ready');
    const landedTimeElement = document.getElementById('landedtime');
    const unloadTimeElement = document.getElementById('unloadtime');
    const collectTimeElement = document.getElementById('collecttime');
    const redirectButton = document.getElementById('redirectButton');
    const countdownElement = document.getElementById('countdown');

    // Update class and visibility based on tracking progress
    switch (trackingProgress) {
        case 3:
            landedElement.classList.add('completed');
            unloadedElement.classList.add('completed');
            readyElement.classList.add('completed');
            landedTimeElement.style.display = 'block';
            unloadTimeElement.style.display = 'block';
            collectTimeElement.style.display = 'block';
            //redirectButton.style.display = 'none';
            countdownElement.style.display = 'block';
            break;
        case 2:
            landedElement.classList.add('completed');
            unloadedElement.classList.add('completed');
            readyElement.classList.remove('completed');
            landedTimeElement.style.display = 'block';
            unloadTimeElement.style.display = 'block';
            collectTimeElement.style.display = 'none';
            redirectButton.style.display = 'none';
            countdownElement.style.display = 'none';
            break;
        case 1:
            landedElement.classList.add('completed');
            unloadedElement.classList.remove('completed');
            readyElement.classList.remove('completed');
            landedTimeElement.style.display = 'block';
            unloadTimeElement.style.display = 'none';
            collectTimeElement.style.display = 'none';
            redirectButton.style.display = 'none';
            countdownElement.style.display = 'none';
            break;
        default:
            landedElement.classList.remove('completed');
            unloadedElement.classList.remove('completed');
            readyElement.classList.remove('completed');
            landedTimeElement.style.display = 'none';
            unloadTimeElement.style.display = 'none';
            collectTimeElement.style.display = 'none';
            redirectButton.style.display = 'none';
            countdownElement.style.display = 'none';
    }
};

