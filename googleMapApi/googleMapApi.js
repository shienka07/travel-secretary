let map;
let geocoder;
let markers = [];
let polylines = []; // 각 날짜별 경로를 저장할 배열
let dayCount = 1; // 초기 날짜 수

// 날짜별 섹션 토글
function toggleSection(dayId) {
  const section = document.getElementById(dayId);
  section.classList.toggle("hidden");
}

// 날짜 추가 버튼 클릭 시, 새로운 날짜 섹션 생성
document.getElementById("addDayBtn").addEventListener("click", function () {
  dayCount++;
  const daysContainer = document.getElementById("daysContainer");
  const newDaySection = document.createElement("div");
  newDaySection.className = "day-section";
  newDaySection.innerHTML = `
    <h3 onclick="toggleSection('day${dayCount}')">Day ${dayCount}</h3>
    <div id="day${dayCount}" class="day-inputs">
      <div class="place-input-container">
        <input type="text" class="place-input" placeholder="장소를 입력하세요" />
        <button class="delete-place-btn" onclick="deletePlaceInput(this)">삭제</button>
      </div>
      <button class="add-place-btn" onclick="addPlaceInput('day${dayCount}')">장소 추가</button>
    </div>
  `;
  daysContainer.appendChild(newDaySection);
});

// 장소 추가 버튼 클릭 시, 해당 Day에 새로운 입력 필드 추가
function addPlaceInput(dayId) {
  const dayInputs = document.getElementById(dayId);
  const newInputContainer = document.createElement("div");
  newInputContainer.className = "place-input-container";
  newInputContainer.innerHTML = `
    <input type="text" class="place-input" placeholder="장소를 입력하세요" />
    <button class="delete-place-btn" onclick="deletePlaceInput(this)">삭제</button>
  `;
  dayInputs.insertBefore(newInputContainer, dayInputs.lastElementChild);
}

// 장소 삭제 버튼 클릭 시, 해당 입력 필드 삭제
function deletePlaceInput(button) {
  const inputContainer = button.parentElement;
  inputContainer.remove();
}

// 전체 경로 그리기
function drawAllRoutes() {
  clearMap(); // 지도 초기화
  const daySections = document.querySelectorAll(".day-inputs");
  daySections.forEach((section, dayIndex) => {
    drawRouteForDay(section, dayIndex);
  });
}

// 선택 날짜 경로 그리기
function drawDayRoutes() {
  clearMap(); // 지도 초기화
  const daySections = document.querySelectorAll(".day-inputs");
  daySections.forEach((section, dayIndex) => {
    if (!section.classList.contains("hidden")) {
      drawRouteForDay(section, dayIndex);
    }
  });
}

// 특정 Day의 경로 그리기
function drawRouteForDay(section, dayIndex) {
  const inputs = section.querySelectorAll(".place-input");
  const dayPlaces = [];

  let geocodePromises = [];

  // 입력된 장소를 좌표로 변환
  inputs.forEach((input, placeIndex) => {
    const placeName = input.value.trim();
    if (placeName) {
      const geocodePromise = new Promise((resolve, reject) => {
        geocoder.geocode({ address: placeName }, function (results, status) {
          if (status === "OK") {
            const location = results[0].geometry.location;
            resolve({ location, placeIndex });
          } else {
            reject("장소를 찾을 수 없습니다: " + placeName);
          }
        });
      });
      geocodePromises.push(geocodePromise);
    }
  });

  // 모든 geocode 요청이 완료된 후 마커와 경로 그리기
  Promise.all(geocodePromises)
    .then((results) => {
      // 인덱스 순서대로 정렬
      results.sort((a, b) => a.placeIndex - b.placeIndex);

      // 정렬된 순서대로 마커와 경로 추가
      results.forEach((result, i) => {
        const location = result.location;
        const marker = new google.maps.Marker({
          map: map,
          position: location,
          label: `Day ${dayIndex + 1}-${i + 1}`, // 마커에 날짜와 순서 표시
          icon: getMarkerIcon(dayIndex), // 날짜별로 다른 마커 아이콘
        });
        markers.push(marker);
        dayPlaces.push(location);

        // 지도 중심을 첫 번째 장소로 이동
        if (i === 0 && dayIndex === 0) {
          map.setCenter(location);
        }
      });

      // 경로 그리기
      if (dayPlaces.length >= 2) {
        const polyline = new google.maps.Polyline({
          path: dayPlaces,
          geodesic: true,
          strokeColor: getDayColor(dayIndex), // 날짜별로 다른 색상
          strokeOpacity: 1.0,
          strokeWeight: 2,
        });
        polyline.setMap(map);
        polylines.push(polyline);
      }
    })
    .catch((error) => {
      alert(error);
    });
}

// 지도 초기화 (마커와 경로 제거)
function clearMap() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
  polylines.forEach((polyline) => polyline.setMap(null));
  polylines = [];
}

// 날짜별 마커 아이콘 반환
function getMarkerIcon(dayIndex) {
  const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFA500", "#800080"]; // 색상 배열
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: colors[dayIndex % colors.length],
    fillOpacity: 1,
    strokeWeight: 0,
    scale: 8,
  };
}

// 날짜별 경로 색상 반환
function getDayColor(dayIndex) {
  const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFA500", "#800080"]; // 색상 배열
  return colors[dayIndex % colors.length];
}

// 토글 버튼 클릭 시, 여행 경로 안내 섹션 보이기/숨기기
document
  .getElementById("toggleRouteSectionBtn")
  .addEventListener("click", function () {
    const routeSection = document.getElementById("routeSection");
    // 섹션이 보이면 숨기고, 숨겨져 있으면 보이게 함
    if (
      routeSection.style.display === "none" ||
      routeSection.style.display === ""
    ) {
      routeSection.style.display = "block";
    } else {
      routeSection.style.display = "none";
    }
  });
