document.addEventListener("DOMContentLoaded", function () {
  // Form과 요소들을 제대로 선택
  const controllerForm = document.getElementById("controller");
  const inputField = controllerForm.querySelector("input[name='destination']"); // 원하는 input 필드를 정확히 선택
  const submitBtn = controllerForm.querySelector("button[type='submit']");
  const box = document.getElementById("box");
  const popup = document.getElementById("popup");
  const popupOverlay = document.getElementById("popupOverlay");
  const popupBtn = document.getElementById("closePopupBtn");
  const mapIframe = document.getElementById("mapIframe");
  const saveBtn = document.getElementById("saveBtn");
  const listBtn = document.getElementById("listBtn");
  const listModal = document.getElementById("listModal");
  const listItems = document.getElementById("listItems");

  function saveMarkdown() {
    const markdown = localStorage.getItem("markdown");
    if (markdown !== null) {
      // **********************
      // 마크다운을 데이터베이스에 저장
      // **********************
    } else {
      showToast("저장할 내용이 없습니다.", "danger");
    }
  }

  // 리스트 아이템 데이터 (예시)
  // *************
  // DB에서 불러와야함
  // *************
  const items = [
    { text: "리스트 1" },
    { text: "리스트 2" },
    { text: "리스트 3" },
    { text: "리스트 4" },
  ];

  listModal.addEventListener("shown.bs.modal", () => {
    listItems.innerHTML = ""; // 기존 리스트 초기화

    items.forEach((item) => {
      const li = document.createElement("li");
      li.style.display = "flex"; // flexbox 사용
      li.style.alignItems = "center"; // 수직 가운데 정렬
      li.style.padding = "10px";
      li.style.borderBottom = "1px solid #eee";

      const span = document.createElement("span");
      span.style.flexGrow = "1"; // span이 남은 공간을 모두 차지
      span.textContent = item.text; // 리스트 텍스트 표시

      const loadButton = document.createElement("button");
      loadButton.textContent = "불러오기";
      loadButton.classList.add("btn", "btn-sm", "btn-primary"); // 부트스트랩 버튼 스타일 추가
      loadButton.style.marginLeft = "10px"; // 버튼 왼쪽 여백

      // 버튼 클릭 이벤트 리스너 (예시)
      loadButton.addEventListener("click", () => {
        // *********************
        // DB 내 해당 데이터 불러오기
        // 불러온 데이터 출력
        // addMsg(불러온 데이터)
        // *********************
        alert("불러오기");
      });

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "삭제";
      deleteButton.classList.add("btn", "btn-sm", "btn-primary"); // 부트스트랩 버튼 스타일 추가
      deleteButton.style.marginLeft = "10px"; // 버튼 왼쪽 여백

      // 버튼 클릭 이벤트 리스너 (예시)
      deleteButton.addEventListener("click", () => {
        // ******************
        // DB 내 해당 데이터 삭제
        // ******************
        alert("삭제");
      });

      li.appendChild(span);
      li.appendChild(loadButton);
      li.appendChild(deleteButton);
      listItems.appendChild(li);
    });
  });

  saveBtn.addEventListener("click", saveMarkdown);

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

    const othersInput = document.querySelector('input[name="others"]');

    // 버튼 비활성화
    submitBtn.disabled = true;

    setTimeout(() => {
      showToast("생성중이니 잠시만 기다려주십시오.", "success");
      submitBtn.disabled = false; // 버튼 다시 활성화
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
      if (link.getAttribute("href").includes("https://")) {
        // https://이 포함되면 새 창으로 열기
        link.addEventListener("click", (e) => {
          e.preventDefault(); // 기본 링크 동작을 막고
          const mapUrl = link.getAttribute("href"); // 링크의 URL을 가져옴
          console.log(mapUrl);
          window.open(mapUrl);
        });
      } else if (link.getAttribute("href").includes("DAY")) {
        // DAY가 포함되면
        link.addEventListener("click", (e) => {
          e.preventDefault(); // 기본 링크 동작을 막고
          // **************************
          // 해당 일정 장소들 팝업 지도에 찍기
          // **************************
        });
      } else {
        link.addEventListener("click", (e) => {
          e.preventDefault(); // 기본 링크 동작을 막고
          linkPlace = link.getAttribute("href");
          console.log(linkPlace);

          // ********************************************
          // linkPlace를 구글맵 API로 찾아 API 임배드 URL을 얻기
          // ********************************************
          const googlemapAPiKey = "AIzaSyB83YF__ZJ5WuhL3v8XjgqQBsCqz3wLDwo";
          const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${googlemapAPiKey}&q=${linkPlace}`; // API로 찾은 URL
          openPopup(mapUrl); // 팝업 열기
        });
      }
    });
  };

  // 팝업 열기
  function openPopup(url) {
    mapIframe.src = url; // URL을 iframe의 src로 설정
    popup.style.display = "block"; // 팝업 보이기
    popupOverlay.style.display = "block"; // 오버레이 보이기
    popupBtn.style.display = "block"; // 팝업 닫기 보이기
  }

  // 팝업 닫기
  function closePopup() {
    popup.style.display = "none"; // 팝업 숨기기
    popupOverlay.style.display = "none"; // 오버레이 숨기기
    popupBtn.style.display = "none"; // 팝업 닫기 숨기기
    mapIframe.src = ""; // iframe 초기화
  }

  // 팝업 오버레이 클릭 시 팝업 닫기
  popupOverlay.addEventListener("click", closePopup);
  popupBtn.addEventListener("click", closePopup);

  // submit 데이터 불러오기
  const submitDataStr = localStorage.getItem("submitData");
  if (submitDataStr !== null) {
    const submitData = JSON.parse(submitDataStr); // CSV 형식이므로 쉼표로 분리

    const fieldNames = [
      "destination", // 여행 도시
      "travelDays", // 여행 일수
      "travelTheme", // 여행 스타일
      "travelStart", // 시작 시간
      "travelEnd", // 종료 시간
      "companion", // 동행자
      "budget", // 예산
      "age", // 나이
      "gender", // 성별
      "others", // 기타사항
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
    box.innerHTML = `<span id="spinner" class="spinner-border spinner-border-sm"></span>`;

    // 제출 데이터를 변수에 저장
    const formData = new FormData(controllerForm);
    const [
      destination,
      travelDays,
      travelTheme,
      travelStart,
      travelEnd,
      companion,
      budget,
      age,
      gender,
      others,
    ] = [...formData.keys()].map((key) => formData.get(key));

    // 로컬 스토리지에 저장
    localStorage.setItem(
      "submitData",
      JSON.stringify([
        destination,
        travelDays,
        travelTheme,
        travelStart,
        travelEnd,
        companion,
        budget,
        age,
        gender,
        others,
      ])
    );

    // Gemini 2.0
    // const callModel = async (prompt) => {
    //   try {
    //     const response = await axios.post(
    //       "https://quartz-ruddy-cry.glitch.me/0",
    //       {
    //         text: prompt,
    //       }
    //     );
    //     return response.data.reply;
    //   } catch (error) {
    //     console.error("Error: ", error);
    //   }
    // };

    // Gemini 2.0 thinking
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

    // 일단 주석처리
    // const firstAI = async (
    //   budget,
    //   companion,
    //   destination,
    //   travelDays,
    //   travelStyle
    // ) => {
    //   const prompt = `당신은 세계 최고의 숙소 전문가입니다. 단어만 나열하고 다른 **설명 없이** 출력하세요. 출력 형태는 숙소이름만 작성하고 구분자는 , 으로 합니다. ${travelStyle} 여행을 위한 ${destination}으로 여행을 ${companion}와 같이 갑니다. 전체 여행 예산이 ${budget} 입니다. 이를 바탕으로 숙소를 추천해주세요. 1*${travelDays} 개의 숙소를 추천해주세요. 숙소는 숙소 카테고리가 아닌 세부적으로 특정한 이름을 가진 숙박업소 이름입니다. 구글에 검색하면 해당 장소가 나오도록 **영어로** 작성해야합니다. 출력 형태는 숙소이름만 작성하고 구분자는 , 으로 합니다.`;
    //   return await callModel(prompt);
    // };

    // const firstResponse = await firstAI(
    //   budget,
    //   companion,
    //   destination,
    //   travelDays,
    //   travelStyle
    // );
    // console.log("- **추천 숙소**: " + firstResponse);

    // const secondAI = async (
    //   budget,
    //   companion,
    //   destination,
    //   travelDays,
    //   travelStyle
    // ) => {
    //   const prompt = `당신은 세계 최고의 음식점 전문가입니다. 단어만 나열하고 다른 **설명 없이** 출력하세요. 출력 형태는 음식점이름만 작성하고 구분자는 , 으로 합니다. ${travelStyle} 여행을 위한 ${destination}으로 여행을 ${companion}와 같이 갑니다. 전체 여행 예산이 ${budget} 입니다. 이를 바탕으로 음식점을 추천해주세요. 3*${travelDays} 개의 음식점을 추천해주세요. 음식점은 음식 이름이 아닌 세부적으로 특정한 이름을 가진 가게이름입니다. 구글에 검색하면 해당 장소가 나오도록 **영어로** 작성해야합니다. 출력 형태는 음식점이름만 작성하고 구분자는 , 으로 합니다.`;
    //   return await callModel(prompt);
    // };

    // const secondResponse = await secondAI(
    //   budget,
    //   companion,
    //   destination,
    //   travelDays,
    //   travelStyle
    // );
    // console.log("- **추천 음식점**: " + secondResponse);

    // const thirdAI = async (
    //   budget,
    //   companion,
    //   destination,
    //   travelDays,
    //   travelStyle
    // ) => {
    //   const prompt = `당신은 세계 최고의 관광지 전문가입니다. 단어만 나열하고 다른 **설명 없이** 출력하세요. 출력 형태는 관광지이름만 작성하고 구분자는 , 으로 합니다. ${travelStyle} 여행을 위한 ${destination}으로 여행을 ${companion}와 같이 갑니다. 전체 여행 예산이 ${budget} 입니다. 이를 바탕으로 관광지를 추천해주세요. 2*${travelDays} 개의 관광지를 추천해주세요. 관광지는 도시, 지역명이 아닌 특징이 있는 세부적인 spot입니다. 구글에 검색하면 해당 장소가 나오도록 **영어로** 작성해야합니다. 출력 형태는 관광지이름만 작성하고 구분자는 , 으로 합니다.`;
    //   return await callModel(prompt);
    // };

    // const thirdResponse = await thirdAI(
    //   budget,
    //   companion,
    //   destination,
    //   travelDays,
    //   travelStyle
    // );
    // console.log("- **추천 관광지**: " + thirdResponse);

    // 플래너 생성
    const fourthAI = async (
      destination,
      travelDays,
      travelTheme,
      travelStart,
      travelEnd,
      companion,
      budget,
      age,
      gender,
      others
    ) => {
      const prompt = `당신은 세계 최고의 여행플래너입니다. 아래 여행 정보와 출력 형식입니다. 이에 맞게 최적화하여 여행 계획을 작성해주세요.
여행 정보:
여행지: ${destination}
여행 일수: ${travelDays}
시작시간: ${travelStart} (여행지에 도착하는 시간)
종료시간: ${travelEnd} (여행지에서 떠나는 시간)
1인당 예산: ${budget}
테마: ${travelTheme}
나이: ${age}
성별: ${gender}
동행: ${companion}
기타 사항: ${others}


출력 형식:
장소는 HTML a 태그 형식을 사용하여 href에 URL을 작성하지 않고 href에 장소명을 영문으로 표기
예시: **<a href="장소명 영문">장소명</a>**
예시: **<a href="Eiffel Tower">에펠탑</a>**
장소가 아닌 경우 URL으로 제공
상세 일정에 Day 1, Day 2, Day 3, ... 또한 HTML a 태그 형식을 사용하여 href에 URL을 작성하지 않고 href에 Day 1, Day 2, Day 3, ... 을 표기
예시: **<a href="Day 1">Day 1</a>**
예시: **<a href="Day 2">Day 2</a>**

여행 플래너 템플릿(마크다운): 
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
      destination,
      travelDays,
      travelTheme,
      travelStart,
      travelEnd,
      companion,
      budget,
      age,
      gender,
      others
    );

    localStorage.setItem("markdown", fourthResponse); // 로컬 스토리지에 저장

    const fifthAI = async (fourthResponse) => {
      const prompt = `당신은 최고의 데이터 수집가입니다. 단어만 나열하고 다른 설명 **없이** 출력하세요. 아래의 여행 플래너에서 방문 장소를 수집하여 나열해주세요. 장소는 구글에 검색하면 해당 장소가 나오도록 **영어로** 작성해야합니다. 날짜 별로 중복되는 장소없이 나열하세요. 출력 형태는 숙소이름를 날짜 별로 정리하여 Javascript array 형태로 작성하세요. 날짜 별 구분자는 | 입니다. 예시:["첫날장소1", "첫날장소2", "첫날장소3"]|["둘째날장소1", "둘째날장소2", "둘째날장소3", "둘째날장소4"]|["셋째날장소1", "셋째날장소2"]
${fourthResponse}`;
      return await callModel000(prompt);
    };

    // array 형태의 구분자 | 인 문자열
    const fifthResponse = await fifthAI(fourthResponse);
    console.log(`방문 장소: ${fifthResponse}`);
    try {
      // array 형태의 구분자 | 인 문자열 분해
      const placeArray = fifthResponse.split("|");
      console.log("추출 성공");
      const dailyArray = {};
      placeArray.forEach((e, index) => {
        dailyArray[`Day ${index + 1}`] = JSON.parse(e);
      });
      console.log(dailyArray);
    } catch {
      console.log("추출 실패");
    }

    const spinner = document.getElementById("spinner");
    spinner.classList.add("d-none"); // 스피너 숨기기

    addMsg(`${fourthResponse}`); // 출력

    localStorage.setItem("array", dailyArray);
  });
});
