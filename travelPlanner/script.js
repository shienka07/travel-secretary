document.addEventListener("DOMContentLoaded", function () {
  // Form과 요소들을 제대로 선택
  const controllerForm = document.getElementById("controller");
  const inputField = controllerForm.querySelector("input[name='destination']"); // 원하는 input 필드를 정확히 선택
  const submitBtn = controllerForm.querySelector("button[type='submit']");
  const spinner1 = document.getElementById("spinner1");
  const box = document.getElementById("box");
  const popup = document.getElementById("popup");
  const popupOverlay = document.getElementById("popupOverlay");
  const mapIframe = document.getElementById("mapIframe");

  // Toast 메시지 표시 함수
  function showToast(message, type) {
    const toastContainer = document.querySelector(".toast-container");

    // 새로운 toast 생성
    const toast = document.createElement("div");
    toast.classList.add(
      "toast",
      "align-items-center",
      "text-white",
      "border-0",
      "show"
    );

    // 메시지의 유형에 따라 클래스 추가
    if (type === "success") {
      toast.classList.add("bg-success");
    } else if (type === "danger") {
      toast.classList.add("bg-danger");
    } else if (type === "info") {
      toast.classList.add("bg-info");
    } else {
      toast.classList.add("bg-warning");
    }

    // Toast 내용 추가
    toast.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      `;

    // Toast를 Toast container에 추가
    toastContainer.appendChild(toast);

    // Bootstrap의 Toast 객체 생성 후, 3초 후에 자동으로 사라지게 설정
    const bootstrapToast = new bootstrap.Toast(toast, { delay: 3000 });
    bootstrapToast.show();
  }

  // 폼 제출 이벤트 처리
  controllerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    // inputField가 null인 경우 방지
    if (!inputField) {
      console.error("입력 필드를 찾을 수 없습니다.");
      return;
    }

    const inputData = inputField.value.trim();
    if (!inputData) {
      showToast("입력 필드를 채워주세요!", "danger");
      return;
    }

    // 버튼 비활성화 및 스피너 표시
    submitBtn.disabled = true;
    spinner1.classList.remove("d-none");

    setTimeout(() => {
      showToast("생성중이니 잠시만 기다려주십시오.", "success");
      submitBtn.disabled = false; // 버튼 다시 활성화
      spinner1.classList.add("d-none"); // 스피너 숨기기
    }, 1500);
  });

  // 두 번째 기능 (마크다운 파싱 + 로컬 스토리지 활용)
  const addMsg = (msg) => {
    const p = document.createElement("p");
    p.innerHTML = `<pre>${marked.parse(msg)}</pre>`; // 마크다운 파싱
    box.appendChild(p);
    // 팝업
    const links = p.querySelectorAll("a");
    links.forEach((link) => {
      if (
        link.getAttribute("href").includes("https://www.google.com/maps/embed")
      ) {
        link.addEventListener("click", (e) => {
          e.preventDefault(); // 기본 링크 동작을 막고
          const mapUrl = link.getAttribute("href"); // 링크의 URL을 가져옴
          openPopup(mapUrl); // 팝업 열기
        });
      } else {
        link.addEventListener("click", (e) => {
          e.preventDefault(); // 기본 링크 동작을 막고
          const mapUrl = link.getAttribute("href"); // 링크의 URL을 가져옴
          window.open(mapUrl);
        });
      }
    });
  };

  // 팝업 열기
  function openPopup(url) {
    mapIframe.src = url; // URL을 iframe의 src로 설정
    popup.style.display = "block"; // 팝업 보이기
    popupOverlay.style.display = "block"; // 오버레이 보이기
  }

  // 팝업 닫기
  function closePopup() {
    popup.style.display = "none"; // 팝업 숨기기
    popupOverlay.style.display = "none"; // 오버레이 숨기기
    mapIframe.src = ""; // iframe 초기화
  }

  // 팝업 오버레이 클릭 시 팝업 닫기
  popupOverlay.addEventListener("click", closePopup);

  // submit 데이터 불러오기
  // submit 데이터 불러오기
  const submitDataStr = localStorage.getItem("submitData");
  if (submitDataStr !== null) {
    const submitData = JSON.parse(submitDataStr); // CSV 형식이므로 쉼표로 분리

    const fieldNames = [
      "destination", // 여행 도시
      "travelDays", // 여행 일수
      "travelStyle", // 여행 스타일
      "travelStart", // 시작 시간
      "travelEnd", // 종료 시간
      "companion", // 동행자
      "budget", // 예산
    ];

    fieldNames.forEach((name, index) => {
      const inputElement = document.querySelector(`[name="${name}"]`);
      if (inputElement) {
        inputElement.value = submitData[index] || ""; // 값이 없으면 빈 문자열
      }
    });
  }

  const markdown = localStorage.getItem("markdown");
  if (markdown !== null) {
    addMsg(markdown);
  }

  const visitPlaceText = localStorage.getItem("array");
  if (visitPlaceText !== null) {
    console.log(visitPlaceText);
  }

  // controllerForm 제출 이벤트
  controllerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    box.innerHTML = `<span id="spinner2" class="spinner-border spinner-border-sm"></span>`;
    box.innerHTML = `<div class="map-frame">
    <h1>add google Map</h1>
    <div class="map-content"> 
      
    </div>
  </div>`;
    const formData = new FormData(controllerForm);
    const [
      destination,
      travelDays,
      travelStart,
      travelEnd,
      travelStyle,
      companion,
      budget,
    ] = [...formData.keys()].map((key) => formData.get(key));

    localStorage.setItem(
      "submitData",
      JSON.stringify([
        destination,
        travelDays,
        travelStart,
        travelEnd,
        travelStyle,
        companion,
        budget,
      ])
    );

    const callModel = async (prompt) => {
      try {
        const response = await axios.post(
          "https://quartz-ruddy-cry.glitch.me/0",
          {
            text: prompt,
          }
        );
        return response.data.reply;
      } catch (error) {
        console.error("Error: ", error);
      }
    };

    const callModel000 = async (prompt) => {
      try {
        const response = await axios.post(
          "https://quartz-ruddy-cry.glitch.me/000",
          {
            text: prompt,
          }
        );
        return response.data.reply;
      } catch (error) {
        console.error("Error: ", error);
      }
    };

    const firstAI = async (
      budget,
      companion,
      destination,
      travelDays,
      travelStyle
    ) => {
      const prompt = `당신은 세계 최고의 숙소 전문가입니다. 단어만 나열하고 다른 **설명 없이** 출력하세요. 출력 형태는 숙소이름만 작성하고 구분자는 , 으로 합니다. ${travelStyle} 여행을 위한 ${destination}으로 여행을 ${companion}와 같이 갑니다. 전체 여행 예산이 ${budget} 입니다. 이를 바탕으로 숙소를 추천해주세요. 1*${travelDays} 개의 숙소를 추천해주세요. 숙소는 숙소 카테고리가 아닌 세부적으로 특정한 이름을 가진 숙박업소 이름입니다. 구글에 검색하면 해당 장소가 나오도록 **영어로** 작성해야합니다. 출력 형태는 숙소이름만 작성하고 구분자는 , 으로 합니다.`;
      return await callModel(prompt);
    };

    const firstResponse = await firstAI(
      budget,
      companion,
      destination,
      travelDays,
      travelStyle
    );
    console.log("- **추천 숙소**: " + firstResponse);

    const secondAI = async (
      budget,
      companion,
      destination,
      travelDays,
      travelStyle
    ) => {
      const prompt = `당신은 세계 최고의 음식점 전문가입니다. 단어만 나열하고 다른 **설명 없이** 출력하세요. 출력 형태는 음식점이름만 작성하고 구분자는 , 으로 합니다. ${travelStyle} 여행을 위한 ${destination}으로 여행을 ${companion}와 같이 갑니다. 전체 여행 예산이 ${budget} 입니다. 이를 바탕으로 음식점을 추천해주세요. 3*${travelDays} 개의 음식점을 추천해주세요. 음식점은 음식 이름이 아닌 세부적으로 특정한 이름을 가진 가게이름입니다. 구글에 검색하면 해당 장소가 나오도록 **영어로** 작성해야합니다. 출력 형태는 음식점이름만 작성하고 구분자는 , 으로 합니다.`;
      return await callModel(prompt);
    };

    const secondResponse = await secondAI(
      budget,
      companion,
      destination,
      travelDays,
      travelStyle
    );
    console.log("- **추천 음식점**: " + secondResponse);

    const thirdAI = async (
      budget,
      companion,
      destination,
      travelDays,
      travelStyle
    ) => {
      const prompt = `당신은 세계 최고의 관광지 전문가입니다. 단어만 나열하고 다른 **설명 없이** 출력하세요. 출력 형태는 관광지이름만 작성하고 구분자는 , 으로 합니다. ${travelStyle} 여행을 위한 ${destination}으로 여행을 ${companion}와 같이 갑니다. 전체 여행 예산이 ${budget} 입니다. 이를 바탕으로 관광지를 추천해주세요. 2*${travelDays} 개의 관광지를 추천해주세요. 관광지는 도시, 지역명이 아닌 특징이 있는 세부적인 spot입니다. 구글에 검색하면 해당 장소가 나오도록 **영어로** 작성해야합니다. 출력 형태는 관광지이름만 작성하고 구분자는 , 으로 합니다.`;
      return await callModel(prompt);
    };

    const thirdResponse = await thirdAI(
      budget,
      companion,
      destination,
      travelDays,
      travelStyle
    );
    console.log("- **추천 관광지**: " + thirdResponse);

    const fourthAI = async (
      firstResponse,
      secondResponse,
      thirdResponse,
      budget,
      companion,
      destination,
      travelStart,
      travelEnd,
      travelDays,
      travelStyle
    ) => {
      const prompt = `당신은 세계 최고의 여행플래너입니다. 숙소: ${firstResponse}, 음식점: ${secondResponse}, 관광지: ${thirdResponse} 를 참고하여 예산 ${budget} 내에서 ${companion} 와의 최적화된 ${destination} 여행 계획을 작성해주세요. 숙박, 식사, 활동, 교통비 등을 포함하여 전체 여행 계획을 예산에 맞게 최적화해 주세요. 최소한의 이동경로로 최적화해 주세요. 한국이 아닌 나라는 외국입니다. ${destination}이 한국이 아닌 다른 나라이면 시작과 종료는 인천공항으로 입니다. 한국일 경우 시작과 종료는 ${destination}에서 합니다. 여행 기간은 ${travelDays}입니다. 선호하는 여행 스타일은 ${travelStyle}입니다. 시작 시간은 ${travelStart}이고 도착 시간은 ${travelEnd} 입니다. 마크다운 문법으로 작성하세요. 모든 장소는 구글맵의 해당 장소랑 연결되도록 Google Maps Embed URL을 [장소명](https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d644.9758132495659!2d2.2984690562746146!3d48.85823743249953!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e67aaced6f6555%3A0x5cc483cdedf1cb4d!2sSaid%20Mohamed%20Said%20Hassane!5e0!3m2!1sko!2sus!4v1739004787243!5m2!1sko!2sus)이러한 예시와 같은 헝식으로 작성하세요. **절대 사진형태인 ![]() 형태로 작성 금지**. 올바른 URL 형식은 https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d10499.49642609298!2d2.337644!3d48.860611!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e671d877937b0f%3A0xb975fcfa192f84d4!2z66Oo67iM66W0IOuwleusvOq0gA!5e0!3m2!1sko!2sus!4v1738992890522!5m2!1sko!2sus 입니다. 마크다운은 아래를 참고하세요.
      
# 여행 플래너

## 📍 여행 정보
- **여행지:**  
- **여행 기간:**  
- **여행 스타일:** (예: 휴양, 관광, 액티비티, 맛집 탐방 등)  
- **예산:**  
- **동행 인원:**  
- **필수 체크 사항:** (비자, 백신, 여행 제한 사항 등)  

---

## 🚆 교통 정보
- **공항 ↔ 숙소 이동 방법:**  
- **현지 교통패스:**  
- **대중교통 이용 팁:**  
- **렌터카 정보:**  
- **택시/라이드쉐어 앱:**  

---

## 🏨 숙소 정보
| 날짜 | 지역 | 숙소 이름 | 가격 |
|------|------|-----------|------|
|      |      |           |      |

---

## 📅 상세 일정

### Day 1 - (날짜)
- **시간** 일정  
- **시간** 일정  
- **시간** 일정  

### Day 2 - (날짜)
- **시간** 일정  
- **시간** 일정  
- **시간** 일정  

---

## 🎭 액티비티 & 관광지
| 지역 | 장소 | 운영 시간 | 입장료 |
|------|------|---------|------|
|      |      |         |      |

---

## 🍽️ 맛집 리스트
| 지역 | 맛집 이름 | 추천 메뉴 |
|------|----------|----------|
|      |          |          |

---

## 🏥 응급 상황 대비
- **현지 긴급 번호:**  
- **대사관/영사관 연락처:**  
- **가까운 병원 및 약국:**  
- **여행자 보험 정보:**  
- **분실 시 대처법:**  

---

## 🎟️ 사전 예약 & 준비물
### ✅ 사전 예약 필수
- [ ] 예약 항목 1  
- [ ] 예약 항목 2  

### 🎒 필수 준비물
- [ ] 여권 & 비자  
- [ ] 여행자 보험 서류  
- [ ] 전자기기 (충전기, 보조배터리 등)  
- [ ] 현지 교통카드  
- [ ] 개인 약품  

---

## 💰 예상 경비
| 항목 | 예상 비용 |
|------|--------|
| 항공권 |        |
| 숙박비 |        |
| 식비 |        |
| 교통비 |        |
| 입장료 |        |
| 쇼핑 |        |
| **총합** | **0만원** |

---

## 💡 여행 팁
- ✨ 여행지별 유용한 팁  
- ✨ 현지 문화 & 에티켓  
- ✨ 와이파이 & 데이터 로밍 옵션  

          `;
      return await callModel000(prompt);
    };

    const fourthResponse = await fourthAI(
      firstResponse,
      secondResponse,
      thirdResponse,
      budget,
      companion,
      destination,
      travelStart,
      travelEnd,
      travelDays,
      travelStyle
    );
    localStorage.setItem("markdown", fourthResponse);
    const spinner2 = document.getElementById("spinner2");
    spinner2.classList.add("d-none"); // 스피너 숨기기
    addMsg(`${fourthResponse}`);

    const fifthAI = async (fourthResponse) => {
      const prompt = `당신은 최고의 데이터 수집가입니다. 단어만 나열하고 다른 설명 **없이** 출력하세요. 아래의 여행 플래너에서 방문 장소를 수집하여 나열해주세요. 장소는 구글에 검색하면 해당 장소가 나오도록 **영어로** 작성해야합니다. 중복되는 장소없이 나열하세요. 출력 형태는 숙소이름만 작성하고 구분자는 , 으로 합니다.
                  ${fourthResponse}`;
      return await callModel000(prompt);
    };

    const fifthResponse = await fifthAI(fourthResponse);
    console.log(`방문 장소: ${fifthResponse}`);

    localStorage.setItem("array", JSON.stringify(fifthResponse));
  });
});

function openPlanWindow() {
  window.open("trip-planner.html", "_blank", "width=800,height=600");
}
