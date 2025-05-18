// Initialize Materialize components
document.addEventListener('DOMContentLoaded', function () {
    // Initialize sidenav
    const sidenav = document.querySelectorAll('.sidenav');
    M.Sidenav.init(sidenav);

    // Initialize dropdown
    const dropdowns = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(dropdowns, {
        constrainWidth: false,
        hover: true
    });

    // Initialize tabs
    const tabs = document.querySelectorAll('.tabs');
    M.Tabs.init(tabs);

    // Initialize modals
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);

    // Initialize tooltips
    const tooltips = document.querySelectorAll('.tooltipped');
    M.Tooltip.init(tooltips);

    // Initialize date picker
    const datepickers = document.querySelectorAll('.datepicker');
    M.Datepicker.init(datepickers, {
        format: 'yyyy-mm-dd',
        autoClose: true
    });

    // Initialize select
    const selects = document.querySelectorAll('select');
    M.FormSelect.init(selects);
});

// Flash message auto-dismiss
document.addEventListener('DOMContentLoaded', function () {
    const flashMessages = document.querySelectorAll('.card-panel');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 500);
        }, 5000);
    });
});

// Image preview for file inputs
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.querySelector('#image-preview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Confirm delete
function confirmDelete(message) {
    return confirm(message || 'Are you sure you want to delete this item?');
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Add fade-in animation to elements
document.addEventListener('DOMContentLoaded', function () {
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(element => {
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.opacity = '1';
        }, 100);
    });
});

// Handle form validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('invalid');
        } else {
            field.classList.remove('invalid');
        }
    });

    return isValid;
}

// Handle search form submission
const searchForm = document.querySelector('#search-form');
if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
        const searchInput = this.querySelector('input[name="search"]');
        if (!searchInput.value.trim()) {
            e.preventDefault();
            M.toast({ html: 'Please enter a search term' });
        }
    });
}

// Handle trade status updates
function updateTradeStatus(tradeId, status) {
    if (confirm(`Are you sure you want to ${status.toLowerCase()} this trade?`)) {
        fetch(`/trades/${tradeId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    M.toast({ html: `Trade ${status.toLowerCase()} successfully` });
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    M.toast({ html: data.message || 'Error updating trade status' });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                M.toast({ html: 'Error updating trade status' });
            });
    }
}

// Handle message sending
function sendMessage(tradeId) {
    const messageInput = document.querySelector('#message-input');
    const message = messageInput.value.trim();

    if (message) {
        fetch(`/trades/${tradeId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: message })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    messageInput.value = '';
                    const messageList = document.querySelector('.message-list');
                    const newMessage = document.createElement('div');
                    newMessage.className = 'message sent';
                    newMessage.textContent = message;
                    messageList.appendChild(newMessage);
                    messageList.scrollTop = messageList.scrollHeight;
                } else {
                    M.toast({ html: data.message || 'Error sending message' });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                M.toast({ html: 'Error sending message' });
            });
    }
} 