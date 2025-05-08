// Preloader
window.addEventListener("load", function () {
  const preloader = document.getElementById("preloader");
  const content = document.getElementById("content");

  preloader.style.transition = "opacity 2.5s ease";
  preloader.style.opacity = "0";

  setTimeout(function () {
    preloader.style.display = "none";
    content.style.opacity = "1";
    document.body.style.overflow = "auto";
  }, 300);
});

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: "admin@homeservices.com",
  password: "admin123",
};

// Show login overlay
function showLoginOverlay() {
  document.getElementById("loginOverlay").style.display = "block";
  document.getElementById("signupOverlay").style.display = "none";
  document.body.style.overflow = "hidden";
}

// Close login overlay
function closeLoginOverlay() {
  document.getElementById("loginOverlay").style.display = "none";
  document.body.style.overflow = "auto";
}

// Show signup overlay
function showSignupOverlay() {
  document.getElementById("signupOverlay").style.display = "block";
  document.getElementById("loginOverlay").style.display = "none";
  document.body.style.overflow = "hidden";
}

// Close signup overlay
function closeSignupOverlay() {
  document.getElementById("signupOverlay").style.display = "none";
  document.body.style.overflow = "auto";
}

// Update login link to show overlay
document
  .getElementById("authOption")
  .querySelector("a")
  .addEventListener("click", function (e) {
    showLoginOverlay();
  });

// Form Submissions
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const emailPattern = /^[a-z0-9._%+-]+@[a-z]+\.(com|in|org|net)$/;
  if (!emailPattern.test(username)) {
    alert("Please enter a valid email address!");
    return;
  }

  // Check admin credentials
  if (
    username === ADMIN_CREDENTIALS.email &&
    password === ADMIN_CREDENTIALS.password
  ) {
    localStorage.setItem("isAdmin", "true");
    localStorage.setItem("adminEmail", username);
    localStorage.setItem("userProfile", JSON.stringify({ email: username, name: "Admin", role: "admin" }));
    window.location.href = "admin-dashboard.html";
    return;
  }

  // User login from server
  try {
    const response = await fetch("/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.status === "error") {
      if (data.needsRegistration) {
        if (confirm("Account not found. Would you like to register?")) {
          closeLoginOverlay();
          showSignupOverlay();
        }
      } else {
        alert(data.message);
      }
      return;
    }

    // Success login
    localStorage.setItem("userId", data.user.id);
    localStorage.setItem("username", data.user.username);
    localStorage.setItem("isAdmin", data.user.userType === "admin");
    localStorage.setItem("userEmail", data.user.email);

    closeLoginOverlay();

    if (data.user.userType === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      location.reload();
    }
  } catch (error) {
    console.error("Login Error:", error);
    alert("An error occurred during login");
  }
});


document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("signupUsername").value.trim();
  const mobile = document.getElementById("signupMobile").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const confirmPassword = document.getElementById("signupConfirmPassword").value.trim();
  const userType = document.getElementById("signupUserType").value;

  const emailPattern = /^[a-z0-9._%+-]+@[a-z]+\.(com|in|org|net)$/;
  if (!emailPattern.test(username)) {
    alert("Please enter a valid email address!");
    return;
  }

  const mobilePattern = /^\d{10}$/;
  if (!mobilePattern.test(mobile)) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const response = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, mobile, password, userType }),
    });

    const result = await response.json();
    if (response.ok) {
      alert(result.message);
      closeSignupOverlay();
      showLoginOverlay();
    } else {
      alert(result.message || "An error occurred during registration");
    }
  } catch (error) {
    console.error("Signup Error:", error);
    alert("An error occurred during registration");
  }
});


// Check authentication status on page load
window.addEventListener("load", function () {
  const isAdmin = localStorage.getItem("isAdmin");
  if (isAdmin === "true") {
    window.location.href = "admin-dashboard.html";
  }
});

// Update auth option in header based on login status
function updateAuthOption() {
  const authOption = document.getElementById("authOption");
  const isAdmin = localStorage.getItem("isAdmin");

  if (isAdmin === "true") {
    authOption.innerHTML = '<a href="admin-dashboard.html">Dashboard</a>';
  } else {
    authOption.innerHTML =
      '<a href="#" onclick="showLoginOverlay()">Log In</a>';
  }
}

// Call updateAuthOption on page load
updateAuthOption();

// Slider
let slideIdx = 0;
const slides = document.querySelector(".slides");
const totalSlides = document.querySelectorAll(".slide").length;

function moveSlide(step) {
  slideIdx += step;
  if (slideIdx >= totalSlides) {
    slideIdx = 0;
  } else if (slideIdx < 0) {
    slideIdx = totalSlides - 1;
  }
  updateSlide();
}

function updateSlide() {
  slides.style.transform = `translateX(${-slideIdx * 100}%)`;
}

setInterval(() => {
  moveSlide(1);
}, 4000);

// Chatbot Functions
function toggleChatbot() {
  const chatbot = document.getElementById("chatbotPopup");
  chatbot.style.display = chatbot.style.display === "none" ? "block" : "none";
}

function addMessage(message, isUser = false) {
  const messagesDiv = document.getElementById("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user" : "bot"}`;
  messageDiv.innerHTML = `
      <div class="message-content">
        ${message}
      </div>
    `;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleKeyPress(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}

function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();

  if (message) {
    addMessage(message, true);
    input.value = "";

    // Simulate bot response
    setTimeout(() => {
      const botResponse = getBotResponse(message);
      addMessage(botResponse);
    }, 1000);
  }
}

function sendQuickReply(message) {
  addMessage(message, true);

  // Simulate bot response
  setTimeout(() => {
    const botResponse = getBotResponse(message);
    addMessage(botResponse);
  }, 1000);
}

function getBotResponse(message) {
  message = message.toLowerCase();

  if (message.includes("plumber") || message.includes("plumbing")) {
    return "I can help you with plumbing services. Our plumbers are available 24/7. Would you like to schedule a visit?";
  } else if (
    message.includes("electrical") ||
    message.includes("electrician")
  ) {
    return "Our certified electricians can help you with any electrical issues. When would you like the electrician to visit?";
  } else if (message.includes("ac") || message.includes("hvac")) {
    return "We provide comprehensive AC repair and maintenance services. Would you like to book a service appointment?";
  } else if (message.includes("cleaning")) {
    return "Our cleaning services include home cleaning, deep cleaning, and specialized cleaning. What type of cleaning service are you looking for?";
  } else if (
    message.includes("hello") ||
    message.includes("hi") ||
    message.includes("hey")
  ) {
    return "Hello! How can I assist you today with our home utility services?";
  } else if (
    message.includes("book") ||
    message.includes("schedule") ||
    message.includes("appointment")
  ) {
    return "To schedule a service, please provide your preferred date and time, and I'll help you book an appointment.";
  } else if (
    message.includes("price") ||
    message.includes("cost") ||
    message.includes("rate")
  ) {
    return "Our service rates vary depending on the type of service and complexity. Would you like a detailed quote for a specific service?";
  } else {
    return "I'm here to help with any home utility services. Would you like information about our plumbing, electrical, AC repair, or cleaning services?";
  }
}

// Update header based on authentication status
function updateAuthHeader() {
  const authOption = document.getElementById("authOption");
  const userProfile = JSON.parse(localStorage.getItem("userProfile"));
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (userProfile && !isAdmin) {
    // For regular users
    const profileMenu = `
      <div class="user-menu">
          <div class="profile-icon" title="${userProfile.name}">
              ${userProfile.name.charAt(0).toUpperCase()}
          </div>
          <div class="dropdown-content">
              <div class="dropdown-header">
                  <strong>${userProfile.name}</strong>
                  <small>${userProfile.email}</small>
              </div>
              <a href="edit-profile.html"><i class="fas fa-user-edit"></i> Edit Profile</a>
              <a href="#" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
          </div>
      </div>`;

    authOption.innerHTML = profileMenu;
  } else if (userProfile && isAdmin) {
    // For admin users
    const profileMenu = `
      <div class="user-menu">
          <div class="profile-icon" title="${userProfile.name}">
              ${userProfile.name.charAt(0).toUpperCase()}
          </div>
          <div class="dropdown-content">
              <div class="dropdown-header">
                  <strong>${userProfile.name}</strong>
                  <small>${userProfile.email}</small>
              </div>
              <a href="admin-dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
              <a href="#" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
          </div>
      </div>`;

    authOption.innerHTML = profileMenu;
  } else {
    // No user logged in
    authOption.innerHTML =
      '<a href="#" onclick="showLoginOverlay()">Log In</a>';
  }

  // Add hover event listener for dropdown
  const userMenu = document.querySelector(".user-menu");
  if (userMenu) {
    userMenu.addEventListener("mouseenter", () => {
      userMenu.querySelector(".dropdown-content").style.display = "block";
    });
    userMenu.addEventListener("mouseleave", () => {
      userMenu.querySelector(".dropdown-content").style.display = "none";
    });
  }
}


// Handle logout
function handleLogout() {
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("adminEmail");
  localStorage.removeItem("userProfile");
  window.location.href = "index.html";
}

// Check authentication on page load
document.addEventListener("DOMContentLoaded", function () {
  updateAuthHeader();
});

// Edit Profile Functions
function showEditProfileOverlay() {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  if (isAdmin) return; // Do nothing for admin

  const editProfileOverlay = document.getElementById("editProfileOverlay");
  const userProfile = JSON.parse(localStorage.getItem("userProfile"));

  document.getElementById("avatarInitial").textContent = userProfile.name.charAt(0).toUpperCase();
  document.getElementById("fullName").value = userProfile.name || "";
  document.getElementById("email").value = userProfile.email || "";
  document.getElementById("phoneNumber").value = userProfile.phone || "";
  document.getElementById("about").value = userProfile.about || "";
  document.getElementById("address").value = userProfile.address || "";

  editProfileOverlay.style.display = "block";
  document.body.style.overflow = "hidden";
}


function closeEditProfileOverlay() {
  document.getElementById("editProfileOverlay").style.display = "none";
  document.body.style.overflow = "auto";
}

// Handle Edit Profile Form Submission
document
  .getElementById("editProfileForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    // Get form values
    const formData = {
      name: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phoneNumber").value,
      about: document.getElementById("about").value,
      address: document.getElementById("address").value,
    };

    // Validate phone number
    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(formData.phone)) {
      const phoneInput = document.getElementById("phoneNumber");
      phoneInput.nextElementSibling.textContent =
        "Please enter a valid 10-digit phone number";
      phoneInput.nextElementSibling.classList.add("error");
      return;
    }

    // Update user profile in localStorage
    const userProfile = JSON.parse(localStorage.getItem("userProfile"));
    const updatedProfile = { ...userProfile, ...formData };
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));

    // Update UI
    updateAuthHeader();

    // Show success message and close overlay
    alert("Profile updated successfully!");
    closeEditProfileOverlay();
  });

// Update the click handler for Edit Profile link
document.addEventListener("click", function (e) {
  if (e.target.matches('.dropdown-content a[href="edit-profile.html"]')) {
    e.preventDefault();
    showEditProfileOverlay();
  }
});
