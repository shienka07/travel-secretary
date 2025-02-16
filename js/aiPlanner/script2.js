
import { checkLogin, logout, getProfile } from "../auth.js";

const islogined = await checkLogin();
  if (!islogined) {
    Swal.fire({
      icon: "warning",
      text: "로그인이 필요합니다.",
      confirmButtonText: "확인",
      }).then(() => {
      window.location.href = "../../index.html"; // 확인 버튼 클릭 시 페이지 이동
      });
  }

const username = localStorage.getItem("username") || "Guest";
  document.getElementById("username").textContent = username + " 님";

  if(localStorage.getItem("profile_img"))
    {
        const profile_img = "https://frqevnyaghrnmtccnerc.supabase.co/storage/v1/object/public/mate-bucket/"+ localStorage.getItem("profile_img");
        const profile = document.querySelector("#profile");
        profile.src = profile_img;
    }
    else{
        const data = await getProfile();
        
        if(!data.image_url == ""){
            var profile_img = "https://frqevnyaghrnmtccnerc.supabase.co/storage/v1/object/public/mate-bucket/"+ data.image_url;
        }
        else{
            var profile_img = "https://frqevnyaghrnmtccnerc.supabase.co/storage/v1/object/public/mate-bucket/profile/profile.jpg";
        }
        const profile = document.querySelector("#profile");
        profile.src = profile_img;
    }

  document.getElementById("logout").addEventListener("click", async (event) => {
    event.preventDefault();
    await logout();
    Swal.fire({
      position: "center",
      icon: "success",
      title: "로그아웃!\n메인 페이지로 이동합니다.",
      showConfirmButton: false,
      timer: 1500
    }).then(() => {
      window.location.href = "../../index.html";
    });
  });