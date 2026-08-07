const form = document.getElementById('contact-form');
const statusDialog = document.getElementById('form-status');
const statusMessage = document.getElementById('status-message');
const closeBtn = document.getElementById('close-status');

closeBtn.addEventListener('click', () => {
    statusDialog.close();
});

function validateField(input) {
    const errorSpan = document.getElementById(`${input.id}-error`);
    if (!errorSpan) return true;

    if (!input.validity.valid) {
        input.setAttribute('aria-invalid', 'true');
        errorSpan.hidden = false;

        if (input.validity.valueMissing) {
            errorSpan.textContent = 'Please fill out this field.';
        } else if (input.type === 'email' && input.validity.typeMismatch) {
            errorSpan.textContent = 'Please enter a valid email address.';
        }
        return false;
    } else {
        input.removeAttribute('aria-invalid');
        errorSpan.hidden = true;
        errorSpan.textContent = '';
        return true;
    }
}

form.querySelectorAll('[required]').forEach(input => {
    input.addEventListener('blur', () => {
        validateField(input);
    });

    input.addEventListener('input', () => {
        if (input.hasAttribute('aria-invalid')) {
        validateField(input);
        }
    });
});

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    let isFormValid = true;
    form.querySelectorAll('[required]').forEach(input => {
        const isSingleValid = validateField(input);
        if (!isSingleValid) isFormValid = false;
    });

    if (!isFormValid) return;

    if (statusDialog.open) statusDialog.close();
    statusMessage.textContent = '';

    const button = form.querySelector('button[type="submit"]');

    button.disabled = true;
    document.body.classList.add('is-submitting');

    try {
        const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
        form.reset();
        statusMessage.textContent = "Thank you for your message, we'll get back to you soon.";
        statusDialog.show();
        } else {
        throw new Error();
        }
    } catch (err) {
        statusMessage.textContent = 'There was a problem submitting this form, please try again.';
        statusDialog.show();
    } finally {
        button.disabled = false;
        document.body.classList.remove('is-submitting');
    }
});