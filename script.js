// Define a function to fetch data from the server and update HTML
async function fetchDataAndUpdate() {
    try {
        const passengerId = extractPassengerIdFromUrl();
        if (!passengerId) {
            throw new Error('Passenger ID not found in URL');
        }

        const response = await fetch(`/${passengerId}`);
        const data = await response.json();

        // Update DOM elements with fetched data
        document.getElementById('flightId').textContent = data.flight_id;
        document.getElementById('beltNo').textContent = data.belt_no;
        document.getElementById('trackingProgress').textContent = data.tracking_progress + '%';

        // Update order tracking status based on tracking progress
        updateOrderTracking(data.tracking_progress);
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

// Poll the server at intervals (e.g., every 5 seconds) to check for updates
setInterval(fetchDataAndUpdate, 5000); // 5000 milliseconds = 5 seconds


