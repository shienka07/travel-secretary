import { updatePassword } from "../auth.js";

const resetBtn = document.querySelector("#formData");

resetBtn.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.querySelector("#password").value;

    const confirmPassword_input = document.getElementById("password-confirm");
    const confirmPassword = confirmPassword_input.value;

    const passwordconfirmfeedback = document.querySelector('#passwordConfirmFeedback');

    if ((password !== confirmPassword) || password.length < 8) {
        passwordconfirmfeedback.style.color = '#dc3545';
        passwordconfirmfeedback.textContent = '비밀번호를 다시 입력해주세요. (8~20자)';
        confirmPassword_input.classList.add('is-invalid');
        passwordconfirmfeedback.classList.remove('valid-feedback');
        passwordconfirmfeedback.classList.add('invalid-feedback');
        passwordconfirmfeedback.style.display = 'block';

    return;
    }

    await updatePassword(password);
});