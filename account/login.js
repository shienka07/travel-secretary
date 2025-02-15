import {login, checkLogin, resetPassword} from "../js/auth.js"

const loginBtn = document.querySelector("#loginBtn");

loginBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    const username = document.querySelector("#username").value;
    const password = document.querySelector("#password").value;

    await login(username, password);
});

const islogined = await checkLogin()
if (islogined){
    window.location.href = "../index.html"
}

const reset = document.querySelector("#resetPassword");

reset.addEventListener("click", async (event) => {
    event.preventDefault();
    const container = document.querySelector(".login-container");
    container.innerHTML = `
    <div class="login-container">
    <div class="row align-items-center justify-content-center">
        <div>
            <div class="login-box border rounded">
                <form>
                    <div class="mb-3">
                        <label for="username" class="form-label">아이디</label>
                        <input type="email" class="form-control" id="username" placeholder="이메일">
                    </div>
                    <div class="d-grid" style="margin-top: 20px;">
                        <button id="resetBtn"  type="submit" class="btn btn-dark">이메일 보내기</button>
                    </div>
                </form>
                <div class="d-flex justify-content-between" style="margin-top: 20px;">
                    <a></a>
                    <a href="./register.html">회원가입</a>
                </div>
            </div>
        </div>
    </div>
    </div>
    `
    const resetBtn = document.querySelector("#resetBtn");
    resetBtn.addEventListener("click", async (event)=> {
        event.preventDefault();
        const email = document.querySelector("#username").value;
        if(!email){
            alert("이메일을 입력해주세요")
            return;
        }
        resetPassword(email);

    })
})