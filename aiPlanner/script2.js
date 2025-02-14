
import { checkLogin, logout, getProfile } from "../js/auth.js";

const islogined = await checkLogin();
  if (!islogined) {
    window.location.href =
      "https://aibe-chill-team.github.io/travel-secretary/";
    alert("로그인이 필요합니다");
  }

const username = localStorage.getItem("username") || "Guest";
  document.getElementById("username").textContent = username + " 님";

  if (localStorage.getItem("profile_img")) {
    const profile_img =
      "https://frqevnyaghrnmtccnerc.supabase.co/storage/v1/object/public/mate-bucket/" +
      localStorage.getItem("profile_img");
    const profile = document.querySelector("#profile");
    profile.src = profile_img;
  } else {
    const data = await getProfile();
    const profile_img =
      "https://frqevnyaghrnmtccnerc.supabase.co/storage/v1/object/public/mate-bucket/" +
      data.image_url;
    const profile = document.querySelector("#profile");
    profile.src = profile_img;
  }

  document.getElementById("logout").addEventListener("click", async (event) => {
    event.preventDefault();
    await logout();
    window.location.href = "../index.html";
  });