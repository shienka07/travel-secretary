
import { getProfile, setProfile_auth, logout, checkLogin} from "../auth.js"



async function setDefault() {
    const profile = await getProfile();

    const email = document.querySelector("#email");
    const nickname = document.querySelector("#nickname");
    const age = document.querySelector("#age");
    const male = document.querySelector("#vbtn-radio1")
    const female = document.querySelector("#vbtn-radio2")
    const live = document.querySelector("#live")
    const phone_number = document.querySelector("#phone_number")

    if (profile.gender == 1){
        male.checked = true;
    }
    else{
        female.checked = true;
    }

    age.value = profile.age;
    live.value = profile.live;
    phone_number.value = profile.phone_number;
    nickname.placeholder = profile.username;
    email.placeholder =  profile.email;

}

setDefault();

const nextBtn = document.querySelector("#formData");
nextBtn.addEventListener("submit", async (event) => {
    event.preventDefault();
    await setProfile();
} )

async function setProfile() {
    const form = document.querySelector("#formData")
    const formData = new FormData(form)
    const gender = formData.get("vbtn-radio")
    let phone_number = document.querySelector("#phone_number").value;
    const age =  document.querySelector("#age").value;
    let live = document.querySelector("#live").value;

    phone_number = (phone_number === "") ? null : phone_number;
    live = (live === "") ? null : live;

    const bool = await setProfile_auth(gender, phone_number,age,live);
    if(bool){
        Swal.fire({
        position: "center",
        icon: "success",
        title: "프로필 수정\n 메인 페이지로 이동합니다.",
        showConfirmButton: false,
        timer: 1500
        }).then(() => {
            window.location.href = "../../index.html"; // 확인 버튼 클릭 시 페이지 이동
          });
}
    
}

document.getElementById('phone_number').addEventListener('input', function(e) {
    // 숫자만 입력받고, '-'를 자동으로 추가
    let value = e.target.value.replace(/[^\d]/g, ''); // 숫자만 남기기
    if (value.length <= 3) {
        e.target.value = value;
    } else if (value.length <= 7) {
        e.target.value = value.slice(0, 3) + '-' + value.slice(3);
    } else if (value.length <= 11) {
        e.target.value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
    } else {
        e.target.value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const islogined = await checkLogin()
    if (!islogined){
        Swal.fire({
        icon: "warning",
        text: "로그인이 필요합니다.",
        confirmButtonText: "확인",
        }).then(() => {
        window.location.href = "../../index.html"; // 확인 버튼 클릭 시 페이지 이동
        });
    }

    const username = localStorage.getItem("username") || "Guest";
    document.querySelector("#username").textContent = username + " 님";
    console.log(username);

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
});


