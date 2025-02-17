// supabase
import { addDBData, getDBDataByUserId, getId, deleteDBData } from "./db.js";

// 구글맵 API 키
const googlemapAPiKey = "AIzaSyAg8Mizg_fmz1cMBS3UDFLxOOOzlb0dujw";
// 구글맵 장소 탐색
// 비동기 findPlaceFromQuery, 좌표 지정하고 거리로 검색범위
let map;
let infoWindow;

async function initMap(
  places = ["Googleplex"],
  latLngTxt = '{ "lat": 0, "lng": 0 }'
) {
  const { Map } = await google.maps.importLibrary("maps");
  const { PlacesService } = await google.maps.importLibrary("places");

  let latLng;
  try {
    latLng = JSON.parse(latLngTxt);
    if (typeof latLng !== "object" || latLng === null) {
      latLng = { lat: 0, lng: 0 };
    }
  } catch {
    latLng = { lat: 0, lng: 0 };
  }

  map = new Map(document.getElementById("map"), {
    center: latLng,
    zoom: 15,
  });

  const service = new PlacesService(map);
  infoWindow = new google.maps.InfoWindow();

  if (!places || !Array.isArray(places) || places.length === 0) {
    console.error("장소 데이터가 없거나 올바르지 않습니다.");
    return;
  }

  let bounds = new google.maps.LatLngBounds();
  let completedSearches = 0;

  for (const place of places) {
    try {
      const request = {
        query: place,
        fields: ["name", "geometry", "formatted_address", "place_id", "photos"],
        locationBias: {
          center: latLng,
          radius: 50000,
        },
      };

      await new Promise((resolve) => {
        service.findPlaceFromQuery(request, (results, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results &&
            results.length > 0
          ) {
            const result = results[0];
            const location = result.geometry.location;
            const placeId = result.place_id;

            service.getDetails(
              {
                placeId: placeId,
                fields: ["name", "formatted_address", "photos"],
              },
              (placeResult, detailStatus) => {
                if (
                  detailStatus === google.maps.places.PlacesServiceStatus.OK
                ) {
                  const address =
                    placeResult.formatted_address || "주소 정보 없음";
                  const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
                  const hasPhotos =
                    placeResult.photos && placeResult.photos.length > 0;

                  const marker = new google.maps.Marker({
                    map,
                    position: location,
                    title: placeResult.name,
                  });

                  marker.addListener("click", () => {
                    const photoSection = hasPhotos
                      ? `
                      <div class="card-img-top" style="height: 150px; overflow: hidden;">
                        <img src="${placeResult.photos[0].getUrl()}" 
                          alt="${placeResult.name}" 
                          style="width: 100%; height: 100%; object-fit: cover;">
                      </div>
                    `
                      : "";

                    infoWindow.setContent(`
                      <div class="card" style="width: 100%; border-radius: 8px; overflow: hidden;">
                        ${photoSection}
                        <div class="card-body p-2">
                          <h6 class="card-title text-center mb-1" style="font-size: 14px; margin-top: ${
                            hasPhotos ? "0" : "8px"
                          }">
                            ${placeResult.name}
                          </h6>
                          <p class="card-text text-muted small text-center" style="font-size: 12px; margin: 8px 0">
                            ${address.replace(/, /g, "<br>")}
                          </p>
                          <div class="text-center" style="margin-bottom: 8px">
                            <a href="${googleMapsUrl}" target="_blank" 
                              class="btn btn-primary btn-sm" style="font-size: 12px">
                              Google 지도에서 보기
                            </a>
                          </div>
                        </div>
                      </div>
                    `);
                    infoWindow.open(map, marker);
                  });

                  bounds.extend(location);
                  completedSearches++;

                  if (completedSearches === places.length) {
                    if (!bounds.isEmpty()) {
                      map.fitBounds(bounds);

                      if (places.length === 1) {
                        google.maps.event.addListenerOnce(
                          map,
                          "bounds_changed",
                          () => {
                            map.setZoom(15);
                          }
                        );
                      }
                    }
                  }

                  console.log(
                    `Found place: ${placeResult.name} for search term: ${place}`
                  );
                }
              }
            );
          } else {
            console.warn(`검색 실패 - 장소: ${place}, 상태: ${status}`);
            completedSearches++;
          }
          resolve();
        });
      });
    } catch (error) {
      console.error(`Error searching for ${place}:`, error);
      completedSearches++;
    }
  }
}

// Google Maps API 로드 후 실행할 함수
function loadGoogleMapsAPI() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googlemapAPiKey}&libraries=places`;
    script.async = true; // 비동기 로드
    script.defer = true; // 페이지 파싱이 끝난 후 실행
    script.setAttribute("loading", "lazy"); // 최적화를 위한 loading="lazy" 추가
    script.onload = resolve; // 로드 완료 후 resolve 호출
    document.head.appendChild(script);
  });
}

// API 로드 후 initMap 실행
document.addEventListener("DOMContentLoaded", async () => {
  await loadGoogleMapsAPI();
});

document.addEventListener("DOMContentLoaded", function () {
  // Form과 요소들을 제대로 선택
  const controllerForm = document.getElementById("controller");
  const inputField = controllerForm.querySelector("input[name='destination']"); // 원하는 input 필드를 정확히 선택
  const submitBtn = controllerForm.querySelector("button[type='submit']");
  const box = document.getElementById("box");
  // const popup = document.getElementById("popup");
  const locationsPopup = document.getElementById("locationsPopup");
  // const popupOverlay = document.getElementById("popupOverlay");
  const locationsPopupOverlay = document.getElementById(
    "locationsPopupOverlay"
  );
  // const popupBtn = document.getElementById("closePopupBtn");
  const locationsPopupBtn = document.getElementById("locationsClosePopupBtn");
  // const mapIframe = document.getElementById("mapIframe");
  const saveBtn = document.getElementById("saveBtn");
  const listModal = document.getElementById("listModal");
  const listItems = document.getElementById("listItems");
  const mapPopup = document.getElementById("map");

  async function saveMarkdown() {
    const markdownDB = localStorage.getItem("markdown");
    if (markdownDB !== null) {
      const arrayDB = localStorage.getItem("array");
      const locationDB = localStorage.getItem("location");
      const submitDataDB = JSON.parse(localStorage.getItem("submitData"));

      // Swal.fire를 호출하고 결과를 result에 담는다
      const result = await Swal.fire({
        title: "여행 플래너의 제목을 입력하세요",
        input: "text",
        inputPlaceholder: `${submitDataDB[1]}일간의 ${submitDataDB[0]} ${submitDataDB[2]} 여행`,
        inputValue: `${submitDataDB[1]}일간의 ${submitDataDB[0]} ${submitDataDB[2]} 여행`, // 기본값 설정
        confirmButtonText: "확인",
      });

      let nameDB = `${submitDataDB[1]}일간의 ${submitDataDB[0]} ${submitDataDB[2]} 여행`; // 기본값

      // 결과가 존재하면 nameDB를 업데이트
      if (result.isConfirmed) {
        nameDB = result.value.trim() !== "" ? result.value : nameDB;
      }

      console.log(nameDB);
      console.log(arrayDB);

      // 마크다운과 기타 데이터 저장
      // 마크다운을 데이터베이스에 저장
      // 방문장소를 데이터베이스에 저장
      // 좌표를 데이터베이스에 저장
      // 제목을 데이터베이스에 저장

      try {
        const Id = await getId();
        if (Id) {
          await addDBData(Id, nameDB, markdownDB, locationDB, arrayDB);
          await Swal.fire({
            title: "저장 완료",
            text: `제목: ${nameDB}`,
            icon: "success",
            confirmButtonText: "확인",
          });
        } else {
          console.log("로그인되지 않았거나 유저 정보가 없습니다.");
        }
      } catch (error) {
        console.error("유저 ID 조회 실패:", error);
      }
    } else {
      // showToast("저장할 내용이 없습니다.", "danger");
      Swal.fire({
        icon: "error",
        title: "저장 실패",
        text: "저장할 내용이 없습니다",
      });
    }
  }

  listModal.addEventListener("shown.bs.modal", () => {
    getId()
      .then((Id) => {
        if (Id) {
          getDBDataByUserId(Id)
            .then((items) => {
              console.log(items);
              const fragment = document.createDocumentFragment(); // 저장할 fragment
              items.forEach((item) => {
                const li = document.createElement("li");
                li.style.display = "flex"; // flexbox 사용
                li.style.alignItems = "center"; // 수직 가운데 정렬
                li.style.padding = "10px";
                li.style.borderBottom = "1px solid #eee";

                const span = document.createElement("span");
                span.style.flexGrow = "1"; // span이 남은 공간을 모두 차지
                span.textContent = item.list_name; // 리스트 텍스트 표시

                const loadButton = document.createElement("button");
                loadButton.textContent = "불러오기";
                loadButton.classList.add(
                  "btn",
                  "btn-sm",
                  "btn-success",
                  "btn-call"
                ); // 부트스트랩 버튼 스타일 추가 및 클래스
                loadButton.style.marginLeft = "10px"; // 버튼 왼쪽 여백
                loadButton.style.border = "3px";

                // 불러오기 버튼 클릭 시
                loadButton.addEventListener("click", () => {
                  // 방문장소, 좌표 로컬스토리지에 저장하기
                  localStorage.setItem("array", item.list_daily_places);
                  localStorage.setItem("location", item.list_location);
                  localStorage.setItem("markdown", item.list_content);
                  // box.innerHTML = "";
                  // addMsg(불러온 마크다운)
                  addMsg(item.list_content);
                  Swal.fire({
                    title: "불러오기 완료",
                    text: `제목: ${item.list_name}`,
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                  });
                });

                const deleteButton = document.createElement("button");
                deleteButton.textContent = "삭제";
                deleteButton.classList.add(
                  "btn",
                  "btn-sm",
                  "btn-danger",
                  "btn-outline-primary",
                  "btn-delete"
                ); // 부트스트랩 버튼 스타일 추가 및 클래스
                deleteButton.style.marginLeft = "10px"; // 버튼 왼쪽 여백

                // 삭제 버튼 클릭 시
                deleteButton.addEventListener("click", () => {
                  // DB 내 해당 데이터 삭제
                  Swal.fire({
                    title: "정말 지우시겠습니까?",
                    text: `제목: ${item.list_name}`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "네",
                    cancelButtonText: "아니오",
                  }).then((result) => {
                    if (result.isConfirmed) {
                      Swal.fire({
                        title: "삭제 완료",
                        text: "삭제 되었습니다",
                        icon: "success",
                        showConfirmButton: false,
                        timer: 1500,
                      });
                      listItems.removeChild(li);
                      deleteDBData(item.id);
                    }
                  });
                });

                li.appendChild(span);
                li.appendChild(loadButton);
                li.appendChild(deleteButton);
                fragment.appendChild(li); // fragment에 저장
              });
              listItems.innerHTML = ""; // 기존 리스트 초기화
              listItems.appendChild(fragment);
            })
            .catch((error) => {
              console.error("데이터 가져오기 실패:", error); // 오류 처리
            });
        } else {
          console.log("로그인되지 않았거나 유저 정보가 없습니다.");
        }
      })
      .catch((error) => {
        console.error("유저 ID 조회 실패:", error);
      });
  });

  saveBtn.addEventListener("click", saveMarkdown);

  // Toast 메시지 표시 함수
  // function showToast(message, type) {
  //   const toastContainer = document.querySelector(".toast-container");

  //   // 새로운 toast 생성
  //   const toast = document.createElement("div");
  //   toast.classList.add(
  //     "toast",
  //     "align-items-center",
  //     "text-white",
  //     "border-0",
  //     "show"
  //   );

  //   // 메시지의 유형에 따라 클래스 추가
  //   if (type === "success") {
  //     toast.classList.add("bg-success");
  //   } else if (type === "danger") {
  //     toast.classList.add("bg-danger");
  //   } else if (type === "info") {
  //     toast.classList.add("bg-info");
  //   } else {
  //     toast.classList.add("bg-warning");
  //   }

  //   // Toast 내용 추가
  //   toast.innerHTML = `
  //       <div class="d-flex">
  //         <div class="toast-body">${message}</div>
  //         <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
  //       </div>
  //     `;

  //   // Toast를 Toast container에 추가
  //   toastContainer.appendChild(toast);

  //   // Bootstrap의 Toast 객체 생성 후, 3초 후에 자동으로 사라지게 설정
  //   const bootstrapToast = new bootstrap.Toast(toast, { delay: 3000 });
  //   bootstrapToast.show();
  // }

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
      // showToast("입력 필드를 채워주세요!", "danger");
      Swal.fire({
        icon: "error",
        title: "제출 실패",
        text: "입력 필드를 채워주세요",
      });
      return;
    }

    // 버튼 비활성화
    submitBtn.disabled = true;

    setTimeout(() => {
      // showToast("생성중이니 잠시만 기다려주십시오.", "success");

      submitBtn.disabled = false; // 버튼 다시 활성화
    }, 3000); // 3초 딜레이
  });

  function locationsOpenPopup(places) {
    console.log(places);
    initMap(places, JSON.parse(localStorage.getItem("location"))); // DOMContentLoaded 후에 places 데이터를 initMap에  전달
    locationsPopup.style.display = "block"; // 팝업 보이기
    locationsPopupOverlay.style.display = "block"; // 오버레이 보이기
    locationsPopupBtn.style.display = "block"; // 팝업 닫기 보이기
  }

  // 두 번째 기능 (마크다운 파싱 + 로컬 스토리지 활용)
  const addMsg = (msg) => {
    const p = document.createElement("p");
    box.innerHTML = "";
    p.innerHTML = `<pre>${marked.parse(msg)}</pre>`; // 마크다운 파싱
    box.appendChild(p);
    // 팝업
    const links = p.querySelectorAll("a");
    links.className = "btn-links";
    links.forEach((link) => {
      // 버튼 형식
      link.classList.add(
        "btn",
        "btn-links",
        "btn-secondary",
        "btn-sm",
        "px-1",
        "py-0"
      );
      link.style.fontSize = "inherit";
      if (link.getAttribute("href").includes("https://")) {
        // https://이 포함되면 새 창으로 열기
        link.addEventListener("click", (e) => {
          e.preventDefault(); // 기본 링크 동작을 막고
          const mapUrl = link.getAttribute("href"); // 링크의 URL을 가져옴
          console.log(mapUrl);
          window.open(mapUrl);
        });
      } else if (link.getAttribute("href").includes("Day")) {
        // DAY가 포함되면
        link.addEventListener("click", (e) => {
          e.preventDefault(); // 기본 링크 동작을 막고
          // 해당 일정 장소들 팝업 지도에 찍기
          const mapUrl = link.getAttribute("href"); // 링크의 URL을 가져옴
          console.log(mapUrl);
          const locationsArray = JSON.parse(localStorage.getItem("array"));
          console.log(locationsArray);
          locationsOpenPopup(locationsArray[mapUrl]);
          Swal.fire({
            title: "로딩중",
            html: "잠시 기다려주십요... <b></b>",
            timer: 3000,
            timerProgressBar: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });
        });
      } else {
        link.addEventListener("click", (e) => {
          e.preventDefault(); // 기본 링크 동작을 막고
          const linkPlace = link.getAttribute("href");
          console.log(linkPlace);
          locationsOpenPopup([linkPlace]);
          // const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${googlemapAPiKey}&q=${linkPlace}`; // API로 찾은 URL
          // openPopup(mapUrl); // 팝업 열기
        });
      }
    });
  };

  // // 팝업 열기
  // function openPopup(url) {
  //   mapIframe.src = url; // URL을 iframe의 src로 설정
  //   popup.style.display = "block"; // 팝업 보이기
  //   popupOverlay.style.display = "block"; // 오버레이 보이기
  //   popupBtn.style.display = "block"; // 팝업 닫기 보이기
  // }

  // // 팝업 닫기
  // function closePopup() {
  //   popup.style.display = "none"; // 팝업 숨기기
  //   popupOverlay.style.display = "none"; // 오버레이 숨기기
  //   popupBtn.style.display = "none"; // 팝업 닫기 숨기기
  //   mapIframe.src = ""; // iframe 초기화
  // }

  // // 팝업 오버레이 클릭 시 팝업 닫기
  // popupOverlay.addEventListener("click", closePopup);
  // popupBtn.addEventListener("click", closePopup);

  // 팝업 닫기
  function locationsClosePopup() {
    locationsPopup.style.display = "none"; // 팝업 숨기기
    locationsPopupOverlay.style.display = "none"; // 오버레이 숨기기
    locationsPopupBtn.style.display = "none"; // 팝업 닫기 숨기기
    mapPopup.innerText = ""; // map 초기화
  }

  // 팝업 오버레이 클릭 시 팝업 닫기
  locationsPopupOverlay.addEventListener("click", locationsClosePopup);
  locationsPopupBtn.addEventListener("click", locationsClosePopup);

  // submit 데이터 불러오기
  const submitDataStr = localStorage.getItem("submitData");
  if (submitDataStr !== null) {
    const submitData = JSON.parse(submitDataStr);

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

    Swal.fire({
      title: "AI 여행 플래너 생성 중입니다.",
      html: "생성 이후 자동으로 닫힙니다... <b></b>",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
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

      const thirdAI = async (destination) => {
        const prompt = `${destination}의 latitude, longitude 를 작성하세요. 출력 형식은 설명 없이 { "lat": latitude, "lng": longitude } 로 출력하십시오. 다른 내용을 추가하지마십시오.
      예시: { "lat": 48.858, "lng": 2.294 }
      예시: { "lat": 37.422, "lng": 122.084 }
      다른 내용 추가하지말고
      { "lat": latitude, "lng": longitude }
      마크다운을 사용하지 않고 제시된 형식으로만 출력하십시오.
      `;
        return await callModel(prompt);
      };

      const thirdResponse = await thirdAI(destination);
      console.log("- **위경도**: " + thirdResponse);
      localStorage.setItem("location", JSON.stringify(thirdResponse));

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
href에 들어가는 장소명은 구글맵에 검색할 수 있도록 구체적으로 작성
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
        const prompt = `당신은 최고의 데이터 수집가입니다. 단어만 나열하고 다른 설명 **없이** 출력하세요. 아래의 여행 플래너에서 방문 장소를 수집하여 나열해주세요. 장소는 구글에 검색하면 해당 장소가 나오도록 지역명 포함 **영어로** 작성해야합니다. 날짜 별로 중복되는 장소없이 나열하세요. 출력 형태는 방문 장소를 날짜 별로 정리하여 Javascript array 형태로 작성하세요. 날짜 별 구분자는 | 입니다. 다른 내용을 추가하지마세요. 장소명은 구글맵에 검색할 수 있도록 구체적으로 작성하세요.
예시:["첫날장소1", "첫날장소2", "첫날장소3"]|["둘째날장소1", "둘째날장소2", "둘째날장소3", "둘째날장소4"]|["셋째날장소1", "셋째날장소2"]
마크다운을 사용하지 않고 예시와 같은 형식으로만 출력하고 다른 내용을 추가하지 마세요.
${fourthResponse}`;
        return await callModel000(prompt);
      };

      // array 형태의 구분자 | 인 문자열
      const fifthResponse = await fifthAI(fourthResponse);
      console.log(`방문 장소: ${fifthResponse}`);
      const dailyArray = {};
      try {
        // array 형태의 구분자 | 인 문자열 분해
        const placeArray = fifthResponse.split("|");
        console.log("추출 성공");
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

      localStorage.setItem("array", JSON.stringify(dailyArray));
      Swal.close(); // 작업 완료 시 수동 종료
    } catch (error) {
      console.error("오류 발생:", error);
      Swal.fire("오류 발생!");
    }
  });
});
