function register(e) {
    e.preventDefault();
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;
  
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    users.push({ username, password });
    localStorage.setItem("users", JSON.stringify(users));
    alert("Registered successfully!");
    window.location.href = "login.html";
  }
  
  function login(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find(u => u.username === username && u.password === password);
  
    if (user) {
      localStorage.setItem("loggedInUser", JSON.stringify(user));
      alert("Login successful");
      window.location.href = "dashboard.html";
    } else {
      alert("Invalid credentials");
    }
  }
  
// Add to user.js
function showDashboard() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  
  document.getElementById("user-info").innerHTML = `
    <h3>Welcome, ${user.username}</h3>
    <button onclick="logout()">Logout</button>
  `;
}

function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}

// Add dashboard initialization
if (window.location.pathname.includes("dashboard.html")) {
  showDashboard();
}