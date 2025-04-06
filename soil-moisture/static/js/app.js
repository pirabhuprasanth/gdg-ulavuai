const socket = io(); // Ensure the socket connection is established

// Realtime Soil Moisture Level
socket.on('moisture_update', (data) => {
    const level = data.level; // Ensure the data structure matches the backend
    const moistureBar = document.getElementById('moisture-bar');
    const moistureLevel = document.getElementById('moisture-level');

    if (moistureBar && moistureLevel) { // Ensure elements exist before updating
        moistureBar.style.width = `${level}%`;
        moistureLevel.textContent = `${level}%`;
    } else {
        console.error('Moisture bar or level element not found.');
    }
});

// Equipment Form Submission
document.getElementById('equipment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    fetch('/api/equipment', { // Updated endpoint
        method: 'POST',
        body: formData,
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            alert(data.message);
            loadEquipment();
        })
        .catch((error) => {
            console.error('Error adding equipment:', error);
        });
});

// Load Equipment
function loadEquipment() {
    fetch('/api/equipment') // Updated endpoint
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            const list = document.getElementById('equipment-list');
            list.innerHTML = '';
            data.equipment.forEach((item) => { // Adjusted to match new response structure
                const div = document.createElement('div');
                div.innerHTML = `
                    <h3>${item.name}</h3>
                    <img src="/static/uploads/${item.image}" alt="${item.name}" width="100">
                    <p>Cost per day: $${item.cost_per_day}</p>
                `;
                list.appendChild(div);
            });
        })
        .catch((error) => {
            console.error('Error loading equipment:', error);
        });
}

loadEquipment();

// Add to Cart
function addToCart(item) {
    fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
    })
        .then((response) => response.json())
        .then((data) => {
            alert(data.message);
            loadCart();
        })
        .catch((error) => console.error('Error adding to cart:', error));
}

// Load Cart
function loadCart() {
    fetch('/api/cart')
        .then((response) => response.json())
        .then((data) => {
            const cart = document.getElementById('cart');
            cart.innerHTML = '';
            data.cart.forEach((item) => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <p>${item.name} - $${item.cost_per_day} x ${item.quantity}</p>
                `;
                cart.appendChild(div);
            });
        })
        .catch((error) => console.error('Error loading cart:', error));
}

// Place Order
document.getElementById('place-order').addEventListener('click', () => {
    fetch('/api/orders', { method: 'POST' })
        .then((response) => response.json())
        .then((data) => {
            alert(data.message);
            loadCart();
            loadOrders();
        })
        .catch((error) => console.error('Error placing order:', error));
});

// Load Orders
function loadOrders() {
    fetch('/api/orders')
        .then((response) => response.json())
        .then((data) => {
            const orderHistory = document.getElementById('order-history');
            orderHistory.innerHTML = '';
            data.orders.forEach((order) => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <h3>Order #${order.id}</h3>
                    <p>Total: $${order.total}</p>
                    <ul>
                        ${order.items.map((item) => `<li>${item.name} - $${item.cost_per_day} x ${item.quantity}</li>`).join('')}
                    </ul>
                `;
                orderHistory.appendChild(div);
            });
        })
        .catch((error) => console.error('Error loading orders:', error));
}
