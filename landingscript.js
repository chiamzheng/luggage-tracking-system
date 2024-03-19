document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('passengerForm');
    form.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevent the default form submission

      const passengerIdInput = document.getElementById('passengerId');
      const passengerId = passengerIdInput.value.trim();

      // Redirect to the desired URL using template literals
      window.location.href = `/${passengerId}`;
    });
});