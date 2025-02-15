import { updatePassword } from "../js/auth.js";

window.onload = async function() {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const access_token = urlParams.get('access_token');
    const token_type = urlParams.get('token_type');

    if (!access_token) {
        alert('유효하지 않은 링크입니다.');
        window.location.href = './login.html';
        return;
    }

    // 세션 설정
    const { error } = await supabase.auth.setSession({
        access_token,
        token_type
    });

    if (error) {
        alert('세션 설정 실패: ' + error.message);
        window.location.href = './login.html';
    }
};

const resetBtn = document.querySelector("#loginBtn");

resetBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    const password = document.querySelector("#password").value;
    const password_confirm = document.querySelector("#password_confirm").value;
    if(!password || !password_confirm){
        alert("비밀번호를 입력해주세요")
        return;
    }
    if(password !== password_confirm){
        alert("비밀번호가 일치하지 않습니다")
        return
    }

    await updatePassword(password);
});