// Service booking functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status and update booking buttons
    checkAuthStatus();

    // Add click handlers to all booking buttons
    document.querySelectorAll('.book-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const service = this.getAttribute('data-service');
            showBookingForm(service);
        });
    });
});

// Show booking form
function showBookingForm(service) {
    const overlay = document.getElementById('bookingOverlay');
    const form = document.getElementById('bookingForm');
    const userProfile = JSON.parse(localStorage.getItem('userProfile'));

    if (!userProfile) {
        alert('Please log in to book a service');
        window.location.href = 'signin.html';
        return;
    }

    // Pre-fill form with user data
    document.getElementById('name').value = userProfile.username || '';
    document.getElementById('email').value = userProfile.username || ''; // Using username as email
    document.getElementById('service').value = service;

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').min = today;

    // Show the form
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close booking form
function closeBookingForm() {
    const overlay = document.getElementById('bookingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Handle booking form submission
async function handleBookingSubmit(event) {
    event.preventDefault();
    
    const userProfile = JSON.parse(localStorage.getItem('userProfile'));
    if (!userProfile) {
        alert('Please log in to book a service');
        window.location.href = 'signin.html';
        return;
    }

    // Get form data
    const formData = {
        userId: userProfile.id,
        service: document.getElementById('service').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        date: document.getElementById('bookingDate').value,
        time: document.getElementById('bookingTime').value,
        address: document.getElementById('address').value,
        notes: document.getElementById('notes').value
    };

    // Validate phone number
    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(formData.phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            closeBookingForm();
            showSuccessMessage();
        } else {
            const data = await response.json();
            alert(data.message || 'Booking failed. Please try again.');
        }
    } catch (error) {
        console.error('Booking error:', error);
        alert('Booking failed. Please try again.');
    }
}

// Show success message
function showSuccessMessage() {
    const successOverlay = document.getElementById('successOverlay');
    if (successOverlay) {
        successOverlay.style.display = 'flex';
    }
}

// Close success message
function closeSuccessMessage() {
    const successOverlay = document.getElementById('successOverlay');
    if (successOverlay) {
        successOverlay.style.display = 'none';
    }
}

// Export functions for use in other files
window.handleBookingSubmit = handleBookingSubmit;
window.closeBookingForm = closeBookingForm;
window.closeSuccessMessage = closeSuccessMessage; 