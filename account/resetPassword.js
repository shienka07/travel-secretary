import { updatePassword } from "../js/auth.js";

const resetBtn = document.querySelector("#resetBtn");

resetBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    const password = document.querySelector("#password").value;
    const password_confirm = document.querySelector("#password-confirm").value;
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