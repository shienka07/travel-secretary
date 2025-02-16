import {login, checkLogin, resetPassword} from "../auth.js"

const loginBtn = document.querySelector("#loginBtn");

loginBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    const username = document.querySelector("#username").value;
    const password = document.querySelector("#password").value;

    const bool =  await login(username, password);
    if(bool === false){
        document.querySelector("#username").classList.add("is-invalid");
        document.querySelector("#password").classList.add("is-invalid");
    }
});

const islogined = await checkLogin()
if (islogined){
    window.location.href = "../../index.html"
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
                        <div style="font-size: 13px; color: #dc3545" id="error" class="invalid-feedback">
                            이메일을 입력해주세요.
                        </div>
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
            document.querySelector("#username").classList.add("is-invalid");
            return;
        }
        resetPassword(email);

    })
})