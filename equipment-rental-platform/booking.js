document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("loggedInUser")) {
    window.location.href = "login.html";
  }

  const bookingSection = document.getElementById("booking-section");
  const bookingForm = document.getElementById("bookingForm");

  if (!bookingSection || !bookingForm) return;

  const equipmentId = localStorage.getItem("selectedEquipmentId");

  fetch("data/equipment.json")
    .then(response => response.json())
    .then(data => {
      const item = data.find(eq => eq.id == equipmentId);
      if (!item) {
        bookingSection.innerHTML = "<p>Equipment not found!</p>";
        return;
      }

      bookingSection.innerHTML = `
        <img src="${item.image}" alt="${item.name}" />
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p>₹${item.pricePerDay}/day</p>
      `;

      // Append the form back to the section
      bookingSection.appendChild(bookingForm);
    });

  bookingForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);
    const today = new Date();

    if (startDate < today || endDate < today) {
      alert("Booking dates must be in the future.");
      return;
    }

    if (startDate >= endDate) {
      alert("End date must be after start date.");
      return;
    }

    fetch("data/equipment.json")
      .then(response => response.json())
      .then(data => {
        const item = data.find(eq => eq.id == equipmentId);
        if (!item.available) {
          alert("This equipment is not available for booking.");
          return;
        }

        const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
        const isBooked = bookings.some(booking => {
          const bookingStart = new Date(booking.startDate);
          const bookingEnd = new Date(booking.endDate);
          return booking.equipmentId == equipmentId &&
                 (startDate >= bookingStart && startDate < bookingEnd ||
                  endDate > bookingStart && endDate <= bookingEnd ||
                  startDate <= bookingStart && endDate >= bookingEnd);
        });

        if (isBooked) {
          alert("This equipment is already booked for the selected dates.");
          return;
        }

        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const totalCost = totalDays * item.pricePerDay;

        const confirmBooking = confirm(`Total Cost: ₹${totalCost}\nConfirm Booking?`);
        if (!confirmBooking) return;

        bookings.push({
          equipmentId: equipmentId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          totalCost: totalCost,
          bookedAt: new Date().toISOString()
        });

        localStorage.setItem("bookings", JSON.stringify(bookings));

        alert("Booking Confirmed!");
        window.location.href = "index.html";
      });
  });
});
