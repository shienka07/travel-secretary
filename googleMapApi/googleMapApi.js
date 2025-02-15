// googleMapApi.js

// 전역 변수 선언
let map;
let geocoder;
let markers = [];
let polylines = [];
let dayCount = 1;
let placesService;
// 초기화 함수 (한 번만 정의)
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 5,
  });
  geocoder = new google.maps.Geocoder();
  // Places 서비스 초기화
  placesService = new google.maps.places.PlacesService(map);
}

// DOM 로드 시 이벤트 리스너 등록
document.addEventListener("DOMContentLoaded", function () {
  const addDayBtn = document.getElementById("addDayBtn");
  if (addDayBtn) {
    addDayBtn.addEventListener("click", function () {
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
  }

  const toggleBtn = document.getElementById("toggleRouteSectionBtn");
  const routeSection = document.getElementById("routeSection");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      routeSection.style.display =
        routeSection.style.display === "none" ? "block" : "none";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.getElementById("toggleRouteSectionBtn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", function () {
        if (
          routeSection.style.display === "none" ||
          routeSection.style.display === ""
        ) {
          routeSection.style.display = "block";
        } else {
          routeSection.style.display = "none";
        }
      });
    }
  });
});

function toggleSection(dayId) {
  const section = document.getElementById(dayId);
  section.classList.toggle("hidden");
}

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

function deletePlaceInput(button) {
  const inputContainer = button.parentElement;
  inputContainer.remove();
}

function drawAllRoutes() {
  clearMap();
  const daySections = document.querySelectorAll(".day-inputs");
  daySections.forEach((section, dayIndex) => {
    drawRouteForDay(section, dayIndex);
  });
}

function fitMapToMarkers() {
  const bounds = new google.maps.LatLngBounds();
  markers.forEach((marker) => bounds.extend(marker.getPosition()));
  map.fitBounds(bounds);

  // 줌 레벨이 너무 가깝거나 멀어지는 것을 방지
  const zoom = map.getZoom();
  if (zoom > 15) map.setZoom(15);
  if (zoom < 7) map.setZoom(7);
}

function drawDayRoutes() {
  clearMap();
  const daySections = document.querySelectorAll(".day-inputs");
  daySections.forEach((section, dayIndex) => {
    if (!section.classList.contains("hidden")) {
      drawRouteForDay(section, dayIndex);
    }
  });
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 13,
  });
  geocoder = new google.maps.Geocoder();
  // Places 서비스 초기화
  placesService = new google.maps.places.PlacesService(map);
}

// drawRouteForDay 함수 수정
function drawRouteForDay(section, dayIndex) {
  const inputs = section.querySelectorAll(".place-input");
  const dayPlaces = [];
  let geocodePromises = [];

  inputs.forEach((input, placeIndex) => {
    const placeName = input.value.trim();
    if (placeName) {
      const geocodePromise = new Promise((resolve, reject) => {
        geocoder.geocode({ address: placeName }, function (results, status) {
          if (status === "OK") {
            const location = results[0].geometry.location;

            // Places API로 장소 세부 정보 검색
            const request = {
              query: placeName,
              fields: ["photos", "name", "formatted_address", "place_id"],
            };

            placesService.findPlaceFromQuery(
              request,
              (places, placesStatus) => {
                if (
                  placesStatus === google.maps.places.PlacesServiceStatus.OK &&
                  places &&
                  places.length > 0
                ) {
                  const place = places[0];
                  resolve({
                    location,
                    placeIndex,
                    photo: place.photos ? place.photos[0] : null,
                    name: place.name,
                    address: place.formatted_address,
                  });
                } else {
                  resolve({ location, placeIndex });
                }
              }
            );
          } else {
            reject("장소를 찾을 수 없습니다: " + placeName);
          }
        });
      });
      geocodePromises.push(geocodePromise);
    }
  });

  Promise.all(geocodePromises)
    .then((results) => {
      results.sort((a, b) => a.placeIndex - b.placeIndex);

      results.forEach((result, i) => {
        const marker = new google.maps.Marker({
          map: map,
          position: result.location,
          label: `Day ${dayIndex + 1}-${i + 1}`,
          icon: getMarkerIcon(dayIndex),
        });

        // 정보창(InfoWindow) 생성
        if (result.photo) {
          const photoUrl = result.photo.getUrl({
            maxWidth: 50,
            maxHeight: 50,
          });
          const infowindow = new google.maps.InfoWindow({
            content: `
              <div style="
                display: flex;
                align-items: center;
                background: white;
                border-radius: 25px;
                overflow: hidden;
                box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                padding-right: 12px;
              ">
                <div style="
                  width: 50px;
                  height: 50px;
                  overflow: hidden;
                ">
                  <img src="${photoUrl}" style="
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                  ">
                </div>
                <span style="
                  margin-left: 8px;
                  font-size: 12px;
                  font-weight: 500;
                  color: #333;
                  white-space: nowrap;
                  font-family: 'Arial', sans-serif;
                ">${result.name}</span>
              </div>
            `,
            pixelOffset: new google.maps.Size(0, -10),
            disableAutoPan: true,
          });

          // 정보창 바로 표시
          infowindow.open(map, marker);

          // 마커 클릭시 상세 정보창 표시
          marker.addListener("click", () => {
            const detailWindow = new google.maps.InfoWindow({
              content: `
                <div style="
                  max-width: 200px;
                  background: white;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                  font-family: 'Arial', sans-serif;
                ">
                  <img src="${result.photo.getUrl({
                    maxWidth: 200,
                    maxHeight: 150,
                  })}" style="
                    width: 100%;
                    height: 150px;
                    object-fit: cover;
                  ">
                  <div style="padding: 10px;">
                    <h3 style="
                      margin: 0;
                      color: #333;
                      font-size: 14px;
                      font-weight: 600;
                    ">${result.name}</h3>
                    <p style="
                      margin: 5px 0 0 0;
                      color: #666;
                      font-size: 12px;
                      line-height: 1.3;
                    ">${result.address}</p>
                  </div>
                </div>
              `,
            });
            detailWindow.open(map, marker);
          });
        }
        markers.push(marker);
        dayPlaces.push(result.location);

        if (i === 0 && dayIndex === 0) {
          map.setCenter(result.location);
        }
      });

      if (dayPlaces.length >= 2) {
        // 메인 경로 - 두꺼운 선
        const mainPolyline = new google.maps.Polyline({
          path: dayPlaces,
          geodesic: true,
          strokeColor: getDayColor(dayIndex),
          strokeOpacity: 0.8, // 투명도를 0.4에서 0.8로 증가
          strokeWeight: 4, // 선 굵기를 6에서 4로 조정
        });

        // 경로 하이라이트 - 얇은 실선
        const highlightPolyline = new google.maps.Polyline({
          path: dayPlaces,
          geodesic: true,
          strokeColor: getDayColor(dayIndex),
          strokeOpacity: 1,
          strokeWeight: 3, // 선 굵기를 2에서 3으로 증가
        });

        // 애니메이션 효과를 위한 점선 경로
        const dashedPolyline = new google.maps.Polyline({
          path: dayPlaces,
          geodesic: true,
          strokeColor: getDayColor(dayIndex), // 흰색에서 해당 날짜 색상으로 변경
          strokeOpacity: 1, // 투명도를 0.8에서 1로 증가
          strokeWeight: 2,
          icons: [
            {
              icon: {
                path: "M 0,-1 0,1",
                strokeOpacity: 1,
                scale: 4, // 점선 크기를 3에서 4로 증가
              },
              offset: "0",
              repeat: "20px", // 점선 간격을 15px에서 20px로 증가
            },
          ],
        });

        // 경로에 마우스 오버 효과 추가
        mainPolyline.addListener("mouseover", function () {
          this.setOptions({ strokeOpacity: 1 }); // 마우스 오버시 완전 불투명하게
          highlightPolyline.setOptions({ strokeWeight: 4 });
        });

        mainPolyline.addListener("mouseout", function () {
          this.setOptions({ strokeOpacity: 0.8 });
          highlightPolyline.setOptions({ strokeWeight: 3 });
        });

        // 나머지 코드는 동일
        let count = 0;
        window.setInterval(() => {
          count = (count + 1) % 200;
          const icons = dashedPolyline.get("icons");
          icons[0].offset = count / 2 + "%";
          dashedPolyline.set("icons", icons);
        }, 50);

        mainPolyline.setMap(map);
        highlightPolyline.setMap(map);
        dashedPolyline.setMap(map);

        polylines.push(mainPolyline, highlightPolyline, dashedPolyline);
      }
      if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach((marker) => bounds.extend(marker.getPosition()));

        map.fitBounds(bounds);

        google.maps.event.addListenerOnce(map, "bounds_changed", function () {
          if (this.getZoom() > 16) this.setZoom(16);
          if (this.getZoom() < 7) this.setZoom(7);

          const currentBounds = this.getBounds();
          if (currentBounds) {
            const ne = currentBounds.getNorthEast();
            const sw = currentBounds.getSouthWest();
            const latPadding = (ne.lat() - sw.lat()) * 0.1;
            const lngPadding = (ne.lng() - sw.lng()) * 0.1;
            const newBounds = new google.maps.LatLngBounds(
              new google.maps.LatLng(
                sw.lat() - latPadding,
                sw.lng() - lngPadding
              ),
              new google.maps.LatLng(
                ne.lat() + latPadding,
                ne.lng() + lngPadding
              )
            );
            this.fitBounds(newBounds);
          }
        });
      }
    })
    .catch((error) => {
      alert(error);
    });
}

function clearMap() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
  polylines.forEach((polyline) => polyline.setMap(null));
  polylines = [];
}

function getMarkerIcon(dayIndex) {
  const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFA500", "#800080"];
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: colors[dayIndex % colors.length],
    fillOpacity: 1,
    strokeWeight: 0,
    scale: 8,
  };
}

function getDayColor(dayIndex) {
  const colors = [
    "#FF6B6B", // 빨간색
    "#4ECDC4", // 청록색
    "#45B7D1", // 하늘색
    "#96CEB4", // 민트색
    "#FFEEAD", // 노란색
    "#D4A5A5", // 분홍색
    "#9B59B6", // 보라색
    "#3498DB", // 파란색
  ];
  return colors[dayIndex % colors.length];
}

function displayRouteData(routes) {
  const daysContainer = document.getElementById("daysContainer");
  daysContainer.innerHTML = "";

  routes.forEach((dayRoute) => {
    const daySection = document.createElement("div");
    daySection.className = "day-section";
    daySection.innerHTML = `
      <h3 onclick="toggleSection('day${dayRoute.day}')">Day ${dayRoute.day}</h3>
      <div id="day${dayRoute.day}" class="day-inputs">
        ${dayRoute.places
          .map(
            (place) => `
          <div class="place-input-container">
            <input type="text" class="place-input" value="${place}" />
            <button class="delete-place-btn" onclick="deletePlaceInput(this)">삭제</button>
          </div>
        `
          )
          .join("")}
        <button class="add-place-btn" onclick="addPlaceInput('day${
          dayRoute.day
        }')">장소 추가</button>
      </div>
    `;
    daysContainer.appendChild(daySection);
  });
}

function collectRouteData() {
  const routes = [];
  const daySections = document.querySelectorAll(".day-section");

  daySections.forEach((section, index) => {
    const dayNumber = index + 1;
    const inputs = section.querySelectorAll(".place-input");
    const places = Array.from(inputs)
      .map((input) => input.value.trim())
      .filter((place) => place);

    if (places.length > 0) {
      routes.push({
        day: dayNumber,
        places: places,
      });
    }
  });

  return routes;
}

// 경로 데이터 저장 이벤트 핸들러
async function handleRouteSave() {
  try {
    const routeData = collectRouteData();
    if (routeData.length === 0) {
      alert("저장할 경로 데이터가 없습니다.");
      return;
    }

    // URL에서 posting ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const postingId = urlParams.get("id");
    if (!postingId) {
      alert("게시글 ID를 찾을 수 없습니다.");
      return;
    }

    // routes 컬럼 업데이트
    const { error } = await supabase
      .from("mate_posting")
      .update({ routes: routeData })
      .eq("id", postingId);

    if (error) {
      throw error;
    }

    alert("경로가 성공적으로 저장되었습니다.");
    drawAllRoutes(); // 저장 후 경로 다시 그리기
  } catch (error) {
    console.error("경로 저장 중 오류 발생:", error);
    alert("경로 저장 중 오류가 발생했습니다.");
  }
}

// 저장된 경로 데이터 불러오기
async function loadSavedRoutes(postingId) {
  try {
    const { data, error } = await supabase
      .from("mate_posting")
      .select("routes")
      .eq("id", postingId)
      .single();

    if (error) {
      throw error;
    }

    if (data && data.routes) {
      displayRouteData(data.routes);
      drawAllRoutes();
    }
  } catch (error) {
    console.error("저장된 경로 불러오기 중 오류 발생:", error);
  }
}
