import { signup, checkNickname } from "../js/auth.js"

    const signupBtn = document.querySelector("#signup-btn");
    signupBtn.disabled = true;
    const nicknameInput = document.querySelector("#nickname");

    nicknameInput.addEventListener('input', () => {
      signupBtn.disabled = true;
    });

    document.getElementById("signup-btn").addEventListener("click", async (e) => {
        e.preventDefault();

        const username = document.getElementById("nickname").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("password-confirm").value;

        // 비밀번호 확인 체크
        if(!email){
          alert("이메일을 입력해주세요.");
          return;
        }
        if (password !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        // 약관 필수 동의 체크
        if (!document.getElementById("privacy").checked || !document.getElementById("terms").checked) {
            alert("필수 약관에 동의해야 가입할 수 있습니다.");
            return;
        }

        await signup(email, password, username);
    });

    document.querySelector("#checkNickname").addEventListener("click", async (event) => {
      event.preventDefault();
      const nickname = document.querySelector("#nickname").value.trim();
      if(!nickname){
        alert("닉네임을 입력해주세요");
        return;
      }
      
      const canRegister = await checkNickname(nickname);
      
      signupBtn.disabled = !canRegister;
    });
    