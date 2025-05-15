document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]');
    
    if (!passwordInput || !confirmPasswordInput) return;

    // Create password requirements list
    const requirementsList = document.createElement('ul');
    requirementsList.className = 'password-requirements';
    requirementsList.style.listStyle = 'none';
    requirementsList.style.padding = '0';
    requirementsList.style.margin = '8px 0 0 0';
    requirementsList.style.fontSize = '0.875rem';

    const requirements = [
        { id: 'length', text: 'At least 8 characters long', regex: /.{8,}/ },
        { id: 'uppercase', text: 'Contains uppercase letter', regex: /[A-Z]/ },
        { id: 'lowercase', text: 'Contains lowercase letter', regex: /[a-z]/ },
        { id: 'number', text: 'Contains number', regex: /[0-9]/ },
        { id: 'special', text: 'Contains special character (@$!%*?&)', regex: /[@$!%*?&]/ }
    ];

    // Create list items for each requirement
    requirements.forEach(req => {
        const li = document.createElement('li');
        li.id = `req-${req.id}`;
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.marginBottom = '4px';
        li.style.color = '#666';
        
        const icon = document.createElement('i');
        icon.className = 'material-icons';
        icon.style.fontSize = '16px';
        icon.style.marginRight = '8px';
        icon.textContent = 'close';
        icon.style.color = '#dc3545';
        
        const text = document.createElement('span');
        text.textContent = req.text;
        
        li.appendChild(icon);
        li.appendChild(text);
        requirementsList.appendChild(li);
    });

    // Insert requirements list after password input
    passwordInput.parentNode.insertBefore(requirementsList, passwordInput.nextSibling);

    // Function to check password requirements
    function checkPassword(password) {
        requirements.forEach(req => {
            const li = document.getElementById(`req-${req.id}`);
            const icon = li.querySelector('i');
            const isMet = req.regex.test(password);
            
            icon.textContent = isMet ? 'check' : 'close';
            icon.style.color = isMet ? '#4CAF50' : '#dc3545';
            li.style.color = isMet ? '#4CAF50' : '#666';
        });
    }

    // Function to check if passwords match
    function checkPasswordsMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword) {
            const matchMessage = confirmPasswordInput.parentNode.querySelector('.password-match');
            if (!matchMessage) {
                const div = document.createElement('div');
                div.className = 'password-match';
                div.style.fontSize = '0.875rem';
                div.style.marginTop = '4px';
                confirmPasswordInput.parentNode.appendChild(div);
            }
            
            const message = confirmPasswordInput.parentNode.querySelector('.password-match');
            if (password === confirmPassword) {
                message.textContent = 'Passwords match';
                message.style.color = '#4CAF50';
            } else {
                message.textContent = 'Passwords do not match';
                message.style.color = '#dc3545';
            }
        }
    }

    // Add event listeners
    passwordInput.addEventListener('input', () => {
        checkPassword(passwordInput.value);
        checkPasswordsMatch();
    });

    confirmPasswordInput.addEventListener('input', checkPasswordsMatch);
}); 