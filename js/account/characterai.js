
import { getProfile, logout, uploadImage_auth, checkLogin, setAnswer} from "../auth.js"

const form_container = document.querySelector("#form-container");
const newForm = document.querySelector("#formData");

newForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const selectedValues = [];

    for (let i = 0; i < 5; i++) {
        const selectedRadio = document.querySelector(`input[name="vbtn-radio-${i}"]:checked`);
        if (!selectedRadio) {
            return; // 선택하지 않은 항목이 있으면 함수 종료
        }
        selectedValues.push(selectedRadio.value);
    }

    const text = `${selectedValues.join(" ")}`;

    const error = await setAnswer(text);

    form_container.removeChild(newForm);
    const spinnerdiv = document.createElement("div");
    spinnerdiv.className = "d-flex justify-content-center align-items-center"
    const spinner = document.createElement("div");
    spinner.className = "spinner-grow";
    spinner.role = "status";
    const spinner_span = document.createElement("span");
    spinner_span.className = "visually-hidden"
    spinner_span.textContent = "Loading..."
    spinner.appendChild(spinner_span);
    spinnerdiv.appendChild(spinner);
    form_container.appendChild(spinnerdiv);


    const url = "https://lightning-puzzled-side.glitch.me/";
    const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
        text,
    }),
    headers: {
        "Content-Type": "Application/json",
    },
    });

    if (response.ok) {
    form_container.removeChild(spinnerdiv)
    var imageBlob = await response.blob();
    var imageURL = URL.createObjectURL(imageBlob);

    const imageTag = document.createElement("img");
    imageTag.classList.add("img-fluid");
    imageTag.src = imageURL;

    form_container.appendChild(imageTag);  // 이미지가 body에 추가됨
    } else {
    console.error("이미지 로드 실패:", response.statusText);
    }
    
    const cardDiv = document.createElement('div');
    cardDiv.className = "d-flex align-items-center justify-content-center"
    const cardBody = document.createElement('div');
    const cardTitle = document.createElement('h1');
    cardTitle.classList.add('card-title');
    cardTitle.textContent = `당신에게 추천하는 캐릭터입니다.`;
    const cardText = document.createElement('p');
    cardText.classList.add('card-text');
    cardText.textContent = "프로필 사진으로 저장하시려면 저장 버튼을 눌러주세요";
    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardText);

    cardDiv.appendChild(cardBody);

    form_container.appendChild(cardDiv);


    const buttondiv2 = document.createElement("div");
    buttondiv2.style = "margin-top : 50px;"
    buttondiv2.className = "d-flex justify-content-between"
    const skipBtn2 = document.createElement("a");
    skipBtn2.href = "../../index.html";
    skipBtn2.textContent = "건너뛰기"
    
    const sumbitBtn2 = document.createElement("button");
    sumbitBtn2.type = "button";
    sumbitBtn2.className = "btn btn-light";
    sumbitBtn2.textContent = "저장"


    buttondiv2.appendChild(skipBtn2)
    buttondiv2.appendChild(sumbitBtn2)

    sumbitBtn2.addEventListener("click", async (event) =>{
    event.preventDefault();
    const file = new File([imageBlob], `profile/${Date.now()}_profile.jpg`, { type: "image/jpeg" });
    const filePath = `profile/${Date.now()}_profile.jpg`;
    const bool = await uploadImage_auth(filePath,file);

    if(bool === true){
        Swal.fire({
            position: "center",
            icon: "success",
            title: "프로필 저장 성공!\n메인 페이지로 이동합니다.",
            showConfirmButton: false,
            timer: 1500
          }).then(() => {
            window.location.href = "../../index.html";
          });
    }

    })
    form_container.appendChild(buttondiv2)
})

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
