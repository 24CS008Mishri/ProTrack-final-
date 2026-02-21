/**
 * Global ProTrack Utility System
 * Handles cross-page alerts and theme-consistent notifications
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check if there is a pending message from a previous page
    const pendingMessage = localStorage.getItem('protrack_alert_msg');
    const pendingType = localStorage.getItem('protrack_alert_type');

    if (pendingMessage) {
        showAlert(pendingMessage, pendingType);
        // Clear memory so it doesn't repeat on refresh
        localStorage.removeItem('protrack_alert_msg');
        localStorage.removeItem('protrack_alert_type');
    }
});

let alertTimer;

/**
 * Main Alert Function
 * @param {string} message - Text to display
 * @param {string} type - 'success' (Teal) or 'error' (Orange)
 * @param {boolean} redirect - If true, saves message for the next page load
 */
function showAlert(message, type = 'success', redirect = false) {
    if (redirect) {
        localStorage.setItem('protrack_alert_msg', message);
        localStorage.setItem('protrack_alert_type', type);
        return;
    }

    const alertBox = document.getElementById('common-alert');
    const alertText = document.getElementById('alert-text');
    const alertIcon = document.getElementById('alert-icon');

    if (!alertBox) return;

    // Reset state for rapid-fire clicks
    clearTimeout(alertTimer);
    alertBox.classList.remove('show');

    // Update Content & Theme
    setTimeout(() => {
        alertText.innerText = message;
        
        if (type === 'success') {
            alertIcon.className = 'fas fa-check-circle';
            alertIcon.style.color = '#70a1a1'; // Muted Teal
        } else {
            alertIcon.className = 'fas fa-exclamation-circle';
            alertIcon.style.color = '#ff9800'; // Soft Orange
        }

        alertBox.classList.add('show');

        alertTimer = setTimeout(() => {
            alertBox.classList.remove('show');
        }, 3000);
    }, 50);
}

function showPrompt(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-prompt');
        const input = document.getElementById('prompt-input');
        const confirmBtn = document.getElementById('prompt-confirm');
        const cancelBtn = document.getElementById('prompt-cancel');

        // Set content
        document.getElementById('prompt-title').innerText = title;
        document.getElementById('prompt-message').innerText = message;
        input.value = '';
        modal.style.display = 'flex';
        input.focus();

        // Handle Confirm
        confirmBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(input.value);
        };

        // Handle Cancel
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(null);
        };
    });
}
