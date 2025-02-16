import { signup, checkNickname } from "../auth.js"

    const signupBtn = document.querySelector("#signup-btn");
    signupBtn.disabled = true;
    const nickname_input = document.querySelector("#nickname");

    nickname_input.addEventListener('input', () => {
      signupBtn.disabled = true;
    });

    document.getElementById("signup-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const username_input = document.getElementById("nickname");
        const username = username_input.value;
        const email_input = document.getElementById("email");
        const email = email_input.value;
        const password_input = document.getElementById("password");
        const password = password_input.value;
        const confirmPassword_input = document.getElementById("password-confirm");
        const confirmPassword = confirmPassword_input.value;

        const emailfeedback = document.querySelector('#emailFeedback');
        // const passwordfeedback = document.querySelector('#passwordFeedback');
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

        const bool = await signup(email, password, username);

        if(bool === false){
          emailfeedback.style.color = '#dc3545';
          emailfeedback.textContent = '가입한 이메일이 있습니다.';
          email_input.classList.add('is-invalid');
          emailfeedback.classList.remove('valid-feedback');
          emailfeedback.classList.add('invalid-feedback');
          emailfeedback.style.display = 'block';
          return;
        }
        else{
          Swal.fire({
            position: "center",
            icon: "success",
            title: "회원가입 성공!\n 로그인 페이지로 이동합니다.",
            showConfirmButton: false,
            timer: 1500
          }).then(() => {
            window.location.href = "./login.html";
          });
        }
    });

    document.querySelector("#checkNickname").addEventListener("click", async (event) => {
      event.preventDefault();
      const nickname_input = document.querySelector("#nickname");
      const nickname = nickname_input.value.trim();
      const feedback = document.querySelector("#nicknameFeedback");
      if(!nickname){
        feedback.style.color = '#dc3545';
        feedback.textContent = '닉네임을 입력해주세요.';
        nickname_input.classList.add('is-invalid');
        feedback.classList.remove('valid-feedback');
        feedback.classList.add('invalid-feedback');
        feedback.style.display = 'block';
        return;
      }
      
      const canRegister = await checkNickname(nickname);

      
      if(!canRegister){
        nickname_input.classList.remove('is-valid');
        nickname_input.classList.add('is-invalid');
        feedback.classList.remove('valid-feedback');
        feedback.classList.add('invalid-feedback');
        feedback.style.color = '#dc3545';
        feedback.textContent = '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.';
      }
      else{
        nickname_input.classList.remove('is-invalid');
        nickname_input.classList.add('is-valid');
        feedback.classList.remove('invalid-feedback');
        feedback.classList.add('valid-feedback');
        feedback.style.color = '#198754';
        feedback.textContent = '사용 가능한 닉네임입니다!';
      }
      feedback.style.display = 'block';
      
      signupBtn.disabled = !canRegister;
    });
    