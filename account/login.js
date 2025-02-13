import {login, checkLogin} from "../js/auth.js"

const loginBtn = document.querySelector("#loginBtn");

loginBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    const username = document.querySelector("#username").value;
    const password = document.querySelector("#password").value;

    await login(username, password);
    window.location.href = "../index.html";
});

const islogined = await checkLogin()
if (islogined){
    window.location.href = "../index.html"
}