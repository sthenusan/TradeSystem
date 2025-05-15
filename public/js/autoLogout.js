class AutoLogout {
    constructor(options = {}) {
        this.timeoutMinutes = options.timeoutMinutes || 30;
        this.warningMinutes = options.warningMinutes || 5;
        this.warningElement = null;
        this.timeout = null;
        this.warningTimeout = null;
        this.events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart'
        ];

        this.initialize();
    }

    initialize() {
        // Only initialize if user is logged in
        if (!document.cookie.includes('connect.sid')) return;

        this.createWarningElement();
        this.startTimer();
        this.events.forEach(event => {
            window.addEventListener(event, () => this.resetTimer());
        });
    }

    startTimer() {
        const warningTime = (this.timeoutMinutes - this.warningMinutes) * 60 * 1000;
        const logoutTime = this.timeoutMinutes * 60 * 1000;

        this.warningTimeout = setTimeout(() => this.showWarning(), warningTime);
        this.timeout = setTimeout(() => this.logout(), logoutTime);
    }

    resetTimer() {
        clearTimeout(this.warningTimeout);
        clearTimeout(this.timeout);
        this.hideWarning();
        this.startTimer();
    }

    createWarningElement() {
        this.warningElement = document.createElement('div');
        this.warningElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #ff9800;
            color: white;
            padding: 16px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            display: none;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;
        
        const message = document.createElement('p');
        message.style.margin = '0 0 10px 0';
        message.textContent = `Your session will expire in ${this.warningMinutes} minutes due to inactivity.`;
        
        const button = document.createElement('button');
        button.textContent = 'Stay Logged In';
        button.style.cssText = `
            background-color: white;
            color: #ff9800;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        `;
        button.onclick = () => this.resetTimer();

        this.warningElement.appendChild(message);
        this.warningElement.appendChild(button);
        document.body.appendChild(this.warningElement);
    }

    showWarning() {
        if (this.warningElement) {
            this.warningElement.style.display = 'block';
        }
    }

    hideWarning() {
        if (this.warningElement) {
            this.warningElement.style.display = 'none';
        }
    }

    async logout() {
        try {
            const response = await fetch('/users/logout');
            if (response.ok) {
                window.location.href = '/users/login';
            }
        } catch (error) {
            console.error('Logout failed:', error);
            window.location.href = '/users/login';
        }
    }
}

// Initialize auto logout when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AutoLogout({
        timeoutMinutes: 30,  // Total session time
        warningMinutes: 5    // Show warning 5 minutes before expiry
    });
}); 