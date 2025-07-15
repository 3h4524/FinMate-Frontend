function togglePassword(confirm) {
    let passwordInput;
    let toggleIcon;

    if (confirm) {
        passwordInput = document.getElementById('confirm-password');
        toggleIcon = document.querySelectorAll('.password-toggle')[1];
    } else {
        passwordInput = document.getElementById('password');
        toggleIcon = document.querySelector('.password-toggle');
    }

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    }
}