import {
  getProfile,
  setProfile_auth,
  logout,
  uploadImage_auth,
  checkLogin,
  setAnswer,
} from "../auth.js";

async function setDefault() {
  const profile = await getProfile();

  const email = document.querySelector("#email");
  const nickname = document.querySelector("#nickname");

  nickname.placeholder = profile.username;
  email.placeholder = profile.email;
}

setDefault();

const nextBtn = document.querySelector("#formData");
nextBtn.addEventListener("submit", async (event) => {
  event.preventDefault();
  await setProfile();
});

function addQuestion() {
  const subTitle = document.querySelector("#subtitle");
  subTitle.textContent = "AI 캐릭터 생성";

  const form_container = document.querySelector("#form-container");
  form_container.removeChild(document.querySelector("#formData"));

  const newForm = document.createElement("form");
  newForm.id = "formData";

  const questionItems = [
    { question: "당신은 어떻게 여행하나요?", answer1: "혼자", answer2: "단체" },
    { question: "당신의 여행 스타일은?", answer1: "자연", answer2: "도시" },
    {
      question: "당신의 여행 계획 스타일은?",
      answer1: "계획적",
      answer2: "즉흥적",
    },
    { question: "당신의 여행 속도는?", answer1: "여유롭게", answer2: "빠르게" },
    {
      question: "어떤 종류의 활동을 선호하시나요?",
      answer1: "휴식",
      answer2: "액티비티",
    },
  ];

  questionItems.forEach((item, index) => {
    const questionWrapper = document.createElement("div");
    questionWrapper.className = "mb-3";

    const questionLabel = document.createElement("label");
    questionLabel.textContent = item.question;
    questionLabel.className = "form-label d-block";

    const choiceContainer = document.createElement("div");
    choiceContainer.className =
      "btn-group btn-group-sm d-flex justify-content-center";

    const radio_check1 = document.createElement("input");
    radio_check1.type = "radio";
    radio_check1.className = "btn-check";
    radio_check1.required = true;
    radio_check1.name = `vbtn-radio-${index}`;
    radio_check1.value = item.answer1;
    radio_check1.id = `vbtn-radio1-${index}`;
    radio_check1.autocomplete = "off";

    const label1 = document.createElement("label");
    label1.className = "btn btn-outline-secondary";
    label1.style = "width : 50%;";
    label1.setAttribute("for", `vbtn-radio1-${index}`);
    label1.textContent = item.answer1;

    const radio_check2 = document.createElement("input");
    radio_check2.type = "radio";
    radio_check2.className = "btn-check";
    radio_check2.name = `vbtn-radio-${index}`;
    radio_check2.value = item.answer2;
    radio_check2.id = `vbtn-radio2-${index}`;
    radio_check2.autocomplete = "off";

    const label2 = document.createElement("label");
    label2.className = "btn btn-outline-secondary";
    label2.style = "width : 50%;";
    label2.setAttribute("for", `vbtn-radio2-${index}`);
    label2.textContent = item.answer2;

    choiceContainer.appendChild(radio_check1);
    choiceContainer.appendChild(label1);
    choiceContainer.appendChild(radio_check2);
    choiceContainer.appendChild(label2);

    questionWrapper.appendChild(questionLabel);
    questionWrapper.appendChild(choiceContainer);

    const divider = document.createElement("hr");
    divider.style.margin = "10px 0";

    questionWrapper.appendChild(divider);

    newForm.appendChild(questionWrapper);
  });

  const buttondiv = document.createElement("div");
  buttondiv.className = "d-flex justify-content-between";
  const skipBtn = document.createElement("a");
  skipBtn.href = "../../index.html";
  skipBtn.textContent = "건너뛰기";
  skipBtn.className = "btn btn-skip";

  const sumbitBtn = document.createElement("button");
  sumbitBtn.type = "submit";
  sumbitBtn.className = "btn btn-light";
  sumbitBtn.textContent = "생성";

  newForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const selectedValues = [];

    for (let i = 0; i < questionItems.length; i++) {
      const selectedRadio = document.querySelector(
        `input[name="vbtn-radio-${i}"]:checked`
      );
      if (!selectedRadio) {
        return; // 선택하지 않은 항목이 있으면 함수 종료
      }
      selectedValues.push(selectedRadio.value);
    }

    const text = `${selectedValues.join(" ")}`;

    const error = await setAnswer(text);

    form_container.removeChild(newForm);
    const spinnerdiv = document.createElement("div");
    spinnerdiv.className = "d-flex justify-content-center align-items-center";
    const spinner = document.createElement("div");
    spinner.className = "spinner-grow";
    spinner.role = "status";
    const spinner_span = document.createElement("span");
    spinner_span.className = "visually-hidden";
    spinner_span.textContent = "Loading...";
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
      form_container.removeChild(spinnerdiv);
      var imageBlob = await response.blob();
      var imageURL = URL.createObjectURL(imageBlob);

      const imageTag = document.createElement("img");
      imageTag.classList.add("img-fluid");
      imageTag.src = imageURL;

      form_container.appendChild(imageTag); // 이미지가 body에 추가됨
    } else {
      console.error("이미지 로드 실패:", response.statusText);
    }

    const cardDiv = document.createElement("div");
    cardDiv.className = "d-flex align-items-center justify-content-center";
    const cardBody = document.createElement("div");
    const cardTitle = document.createElement("h1");
    cardTitle.classList.add("card-title");
    cardTitle.textContent = `당신에게 추천하는 캐릭터입니다.`;
    const cardText = document.createElement("p");
    cardText.classList.add("card-text");
    cardText.textContent =
      "프로필 사진으로 저장하시려면 저장 버튼을 눌러주세요";
    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardText);

    cardDiv.appendChild(cardBody);

    form_container.appendChild(cardDiv);

    const buttondiv2 = document.createElement("div");
    buttondiv2.style = "margin-top : 50px;";
    buttondiv2.className = "d-flex justify-content-between";
    const skipBtn2 = document.createElement("a");
    skipBtn2.href = "../../index.html";
    skipBtn2.textContent = "건너뛰기";
    skipBtn2.className = "btn btn-skip";

    const sumbitBtn2 = document.createElement("button");
    sumbitBtn2.type = "button";
    sumbitBtn2.className = "btn btn-light";
    sumbitBtn2.textContent = "저장";

    buttondiv2.appendChild(skipBtn2);
    buttondiv2.appendChild(sumbitBtn2);

    sumbitBtn2.addEventListener("click", async (event) => {
      event.preventDefault();
      const file = new File([imageBlob], `profile/${Date.now()}_profile.jpg`, {
        type: "image/jpeg",
      });
      const filePath = `profile/${Date.now()}_profile.jpg`;
      const bool = await uploadImage_auth(filePath, file);

      if (bool === true) {
        Swal.fire({
          position: "center",
          icon: "success",
          title: "프로필 저장 성공!\n메인 페이지로 이동합니다.",
          showConfirmButton: false,
          timer: 1500,
        }).then(() => {
          window.location.href = "../../index.html";
        });
      }
    });

    form_container.appendChild(buttondiv2);
  });

  buttondiv.appendChild(skipBtn);
  buttondiv.appendChild(sumbitBtn);

  newForm.appendChild(buttondiv);

  form_container.appendChild(newForm);
}

async function setProfile() {
  const form = document.querySelector("#formData");
  const formData = new FormData(form);
  const gender = formData.get("vbtn-radio");
  let phone_number = document.querySelector("#phone_number").value;
  const age = document.querySelector("#age").value;
  let live = document.querySelector("#live").value;

  phone_number = phone_number === "" ? null : phone_number;
  live = live === "" ? null : live;

  addQuestion();
  await setProfile_auth(gender, phone_number, age, live);
}

document.getElementById("phone_number").addEventListener("input", function (e) {
  // 숫자만 입력받고, '-'를 자동으로 추가
  let value = e.target.value.replace(/[^\d]/g, ""); // 숫자만 남기기
  if (value.length <= 3) {
    e.target.value = value;
  } else if (value.length <= 7) {
    e.target.value = value.slice(0, 3) + "-" + value.slice(3);
  } else if (value.length <= 11) {
    e.target.value =
      value.slice(0, 3) + "-" + value.slice(3, 7) + "-" + value.slice(7);
  } else {
    e.target.value =
      value.slice(0, 3) + "-" + value.slice(3, 7) + "-" + value.slice(7, 11);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
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
  document.querySelector("#username").textContent = username + " 님";

  if (localStorage.getItem("profile_img")) {
    const profile_img =
      "https://frqevnyaghrnmtccnerc.supabase.co/storage/v1/object/public/mate-bucket/" +
      localStorage.getItem("profile_img");
    const profile = document.querySelector("#profile");
    profile.src = profile_img;
  } else {
    const data = await getProfile();

    if (!data.image_url == "") {
      var profile_img =
        "https://frqevnyaghrnmtccnerc.supabase.co/storage/v1/object/public/mate-bucket/" +
        data.image_url;
    } else {
      var profile_img =
        "https://frqevnyaghrnmtccnerc.supabase.co/storage/v1/object/public/mate-bucket/profile/profile.jpg";
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
      timer: 1500,
    }).then(() => {
      window.location.href = "../../index.html";
    });
  });
});
