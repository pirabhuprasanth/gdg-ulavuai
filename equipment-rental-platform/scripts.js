window.onload = function () {
    const list = document.getElementById("equipment-list");
    const searchBar = document.getElementById("searchBar");
    const categoryFilter = document.getElementById("category");
    const zoneFilter = document.getElementById("zone");
    const typeFilter = document.getElementById("type");
    const usageFilter = document.getElementById("usage");
    const equipmentNameFilter = document.getElementById("equipmentName");
    let equipmentData = [];

    // Fetch equipment data from JSON file
    fetch("data/equipment.json")
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            equipmentData = data;
            populateFilters(equipmentData);
            displayEquipments(equipmentData);
        })
        .catch(error => {
            console.error("Error loading equipment data:", error);
            list.innerHTML = '<p style="color:red;">Failed to load equipment data.</p>';
        });

    // Populate filters dynamically
    function populateFilters(data) {
        const categories = [...new Set(data.map(item => item.category || "Uncategorized"))];
        const zones = [...new Set(data.map(item => item.zone || "Unknown"))];
        const types = [...new Set(data.map(item => item.type || "General"))];

        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        zones.forEach(zone => {
            const option = document.createElement("option");
            option.value = zone;
            option.textContent = zone;
            zoneFilter.appendChild(option);
        });

        types.forEach(type => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            typeFilter.appendChild(option);
        });
    }

    // Display equipment cards
    function displayEquipments(equipments) {
        list.innerHTML = '';

        if (!equipments || equipments.length === 0) {
            list.innerHTML = '<p>No equipment found.</p>';
            return;
        }

        equipments.forEach(item => {
            const card = document.createElement('div');
            card.className = 'equipment-card';
            card.innerHTML = `
                <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='assets/images/placeholder.jpg';">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <p>₹${item.pricePerDay}/day</p>
                <button class="book-btn" data-id="${item.id}">Book Now</button>
            `;
            list.appendChild(card);
        });

        attachBookNowListeners();
    }

    // Filter equipment based on user input
    function filterEquipments() {
        const keyword = searchBar.value.toLowerCase().trim();
        const selectedCategory = categoryFilter.value;
        const selectedZone = zoneFilter.value;
        const selectedType = typeFilter.value;
        const maxUsage = usageFilter.value;
        const equipmentName = equipmentNameFilter.value.toLowerCase().trim();

        const filtered = equipmentData.filter(eq => {
            const matchesKeyword = eq.name.toLowerCase().includes(keyword) || eq.description.toLowerCase().includes(keyword);
            const matchesCategory = !selectedCategory || eq.category === selectedCategory;
            const matchesZone = !selectedZone || eq.zone === selectedZone;
            const matchesType = !selectedType || eq.type === selectedType;
            const matchesUsage = !maxUsage || eq.usage <= maxUsage;
            const matchesName = !equipmentName || eq.name.toLowerCase().includes(equipmentName);

            return matchesKeyword && matchesCategory && matchesZone && matchesType && matchesUsage && matchesName;
        });

        displayEquipments(filtered);
    }

    // Attach filter event listeners
    searchBar.addEventListener('input', filterEquipments);
    categoryFilter.addEventListener('change', filterEquipments);
    zoneFilter.addEventListener('change', filterEquipments);
    typeFilter.addEventListener('change', filterEquipments);
    usageFilter.addEventListener('input', filterEquipments);
    equipmentNameFilter.addEventListener('input', filterEquipments);
};

// Booking handler
function bookEquipment(id) {
    if (!id) return;
    localStorage.setItem("selectedEquipmentId", id);
    window.location.href = "booking.html";
}

function openModal(equipmentId) {
    const modal = document.getElementById("bookingModal");
    modal.style.display = "flex";

    // Fetch equipment details and populate modal
    fetch("data/equipment.json")
        .then(response => response.json())
        .then(data => {
            const equipment = data.find(eq => eq.id == equipmentId);
            if (equipment) {
                document.getElementById("startDate").value = "";
                document.getElementById("endDate").value = "";
                localStorage.setItem("selectedEquipmentId", equipmentId);
            }
        });
}

function closeModal() {
    const modal = document.getElementById("bookingModal");
    modal.style.display = "none";
}

// Attach "Book Now" event listeners
function attachBookNowListeners() {
    const bookButtons = document.querySelectorAll('.book-btn');
    bookButtons.forEach(button => {
        button.addEventListener('click', function () {
            const equipmentId = this.getAttribute('data-id');
            openModal(equipmentId);
        });
    });
}

// Handle booking form submission
document.getElementById("bookingForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);
    const equipmentId = localStorage.getItem("selectedEquipmentId");
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
            const equipment = data.find(eq => eq.id == equipmentId);
            if (!equipment) {
                alert("Equipment not found.");
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
            const totalCost = totalDays * equipment.pricePerDay;

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
            closeModal();
        });
});
