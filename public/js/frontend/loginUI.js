// loginUI.js — Frontend-only UI enhancements for the login form

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm');
  const passwordInput = document.getElementById('password');
  const userIdInput = document.getElementById('userId');

  // --- Wrap inputs with labels and groups ---
  wrapInput(userIdInput, 'User ID');
  wrapInput(passwordInput, 'Password', true);

  // --- Add subtitle under h2 ---
  const heading = document.querySelector('.auth-container h2');
  if (heading && !document.querySelector('.subtitle')) {
    const sub = document.createElement('p');
    sub.className = 'subtitle';
    sub.textContent = 'Welcome back! Enter your credentials.';
    heading.insertAdjacentElement('afterend', sub);
  }

  // --- Loading state on submit ---
  if (form) {
    form.addEventListener('submit', function () {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Logging in…';
        setTimeout(function () {
          btn.disabled = false;
          btn.textContent = 'Login';
        }, 1500);
      }
    });
  }
});

/**
 * Wraps an input element with a label and optional password toggle.
 */
function wrapInput(input, labelText, isPassword) {
  if (!input) return;

  // Create label
  var label = document.createElement('label');
  label.setAttribute('for', input.id);
  label.textContent = labelText;

  // Create wrapper div
  var group = document.createElement('div');
  group.className = 'input-group';

  // Insert before input
  input.parentNode.insertBefore(label, input);
  input.parentNode.insertBefore(group, input);
  group.appendChild(input);

  // Add password toggle
  if (isPassword) {
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'toggle-password';
    toggle.innerHTML = '👁';
    toggle.setAttribute('aria-label', 'Toggle password visibility');

    toggle.addEventListener('click', function () {
      var isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      toggle.innerHTML = isHidden ? '🙈' : '👁';
    });

    group.appendChild(toggle);
  }
}
