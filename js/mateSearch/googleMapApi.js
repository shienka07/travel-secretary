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
    center: { lat: 37.5665, lng: 126.978 }, // 서울 중심으로 변경
    zoom: 13,
  });
  geocoder = new google.maps.Geocoder();
  placesService = new google.maps.places.PlacesService(map);

  // 지도 초기화 후 이벤트 리스너 설정
  setupMapEventListeners();
}

function setupMapEventListeners() {
  const addDayBtn = document.getElementById("addDayBtn");
  if (addDayBtn) {
    addDayBtn.addEventListener("click", function () {});
  }

  const toggleBtn = document.getElementById("toggleRouteSectionBtn");
  const routeSection = document.getElementById("routeSection");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      routeSection.style.display =
        routeSection.style.display === "none" ? "block" : "none";
    });
  }
}

// detail.js에 추가
function handleRouteSave() {
  try {
    saveRouteToSupabase();
  } catch (error) {
    console.error("Route save failed:", error);
  }
}

function setupRouteSaveButton() {
  const saveRouteBtn = document.getElementById("saveRouteBtn");
  if (saveRouteBtn) {
    saveRouteBtn.addEventListener("click", handleRouteSave);
  }
}

// DOM 로드 시 이벤트 리스너 등록
document.addEventListener("DOMContentLoaded", function () {
  let dayCount = document.getElementsByClassName("day-section").length || 0;

  const addDayBtn = document.getElementById("addDayBtn");
  if (addDayBtn) {
    addDayBtn.addEventListener("click", function () {
      dayCount++;
      const daysContainer = document.getElementById("daysContainer");

      while (document.getElementById(`day${dayCount}`)) {
        dayCount++;
      }
      const newDaySection = document.createElement("div");
      newDaySection.className = "day-section";
      const dayId = `day${dayCount}`;

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
});

function toggleSection(dayId) {
  const section = document.getElementById(dayId);
  section.classList.toggle("hidden");
}

function addPlaceInput(dayId) {
  const dayInputs = document.getElementById(dayId);
  if (!dayInputs) {
    console.error(`Day element with id ${dayId} not found`);
    return;
  }

  const newInputContainer = document.createElement("div");
  newInputContainer.className = "place-input-container";
  newInputContainer.innerHTML = `
    <input type="text" class="place-input" placeholder="장소를 입력하세요" />
    <button class="delete-place-btn" onclick="deletePlaceInput(this)">삭제</button>
  `;

  const addPlaceBtn = dayInputs.querySelector(".add-place-btn");
  if (addPlaceBtn) {
    dayInputs.insertBefore(newInputContainer, addPlaceBtn);
  }
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

// drawRouteForDay 함수 수정
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
                    placeId: place.place_id,
                  });
                } else {
                  resolve({ location, placeIndex });
                }
              }
            );
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "장소를 찾을 수 없습니다: " + placeName,
            });
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
        // 커스텀 아이콘 생성
        const icon = {
          url: result.photo
            ? result.photo.getUrl({ maxWidth: 50, maxHeight: 50 })
            : null,
          size: new google.maps.Size(50, 50),
          scaledSize: new google.maps.Size(50, 50),
          anchor: new google.maps.Point(25, 25),
          labelOrigin: new google.maps.Point(25, -10),
        };

        // 기본 마커 옵션
        const markerOptions = {
          map: map,
          position: result.location,
          label: {
            text: `Day${dayIndex + 1}-${i + 1}`,
            color: "#FFFFFF",
            fontSize: "11px",
            fontWeight: "bold",
            className: "marker-label",
          },
          icon: result.photo
            ? icon
            : {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: getDayColor(dayIndex),
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#FFFFFF",
                scale: 15,
                labelOrigin: new google.maps.Point(0, -20),
              },
          placeInfo: {
            name: result.name || `Place ${i + 1}`,
            address: result.address || "",
            photo: result.photo,
            dayIndex: dayIndex,
            orderIndex: i,
            placeId: result.placeId,
          },
        };

        const marker = new google.maps.Marker(markerOptions);

        // 마커 클릭 이벤트 핸들러
        marker.addListener("click", () => {
          const request = {
            placeId: result.placeId,
            fields: [
              "name",
              "formatted_address",
              "rating",
              "formatted_phone_number",
              "website",
              "opening_hours",
              "reviews",
            ],
          };

          placesService.getDetails(request, (placeResult, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              // Google Maps 링크 생성
              const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${result.placeId}`;

              // 영업시간 정보 포맷팅
              let hoursHTML = "";
              if (
                placeResult.opening_hours &&
                placeResult.opening_hours.weekday_text
              ) {
                hoursHTML = `
                  <div style="margin-top: 8px;">
                    <strong>영업시간:</strong><br>
                    ${placeResult.opening_hours.weekday_text.join("<br>")}
                  </div>
                `;
              }

              // 리뷰 정보 포맷팅
              let reviewsHTML = "";
              if (placeResult.reviews && placeResult.reviews.length > 0) {
                const review = placeResult.reviews[0];
                reviewsHTML = `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                    <strong>최근 리뷰:</strong><br>
                    ⭐ ${review.rating}/5 - ${review.text.slice(0, 100)}...
                  </div>
                `;
              }

              const detailWindow = new google.maps.InfoWindow({
                content: `
                  <div style="
                    max-width: 300px;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                    font-family: 'Arial', sans-serif;
                  ">
                    ${
                      result.photo
                        ? `
                      <img src="${result.photo.getUrl({
                        maxWidth: 300,
                        maxHeight: 200,
                      })}" style="
                        width: 100%;
                        height: 200px;
                        object-fit: cover;
                      ">
                    `
                        : ""
                    }
                    <div style="padding: 16px;">
                      <h3 style="
                        margin: 0;
                        color: #333;
                        font-size: 16px;
                        font-weight: 600;
                      ">${placeResult.name}</h3>
                      
                      <p style="
                        margin: 8px 0;
                        color: #666;
                        font-size: 13px;
                        line-height: 1.4;
                      ">
                        ${placeResult.formatted_address}
                      </p>
                      
                      ${
                        placeResult.rating
                          ? `
                        <div style="margin: 8px 0;">
                          <strong>평점:</strong> ⭐ ${placeResult.rating}/5
                        </div>
                      `
                          : ""
                      }
                      
                      ${
                        placeResult.formatted_phone_number
                          ? `
                        <div>
                          <strong>전화:</strong> ${placeResult.formatted_phone_number}
                        </div>
                      `
                          : ""
                      }
                      
                      ${hoursHTML}
                      ${reviewsHTML}
                      
                      <div style="
                        margin-top: 16px;
                        display: flex;
                        gap: 8px;
                      ">
                        ${
                          placeResult.website
                            ? `
                          <a href="${placeResult.website}" target="_blank" style="
                            padding: 8px 16px;
                            background: #4285f4;
                            color: white;
                            text-decoration: none;
                            border-radius: 4px;
                            font-size: 13px;
                          ">웹사이트</a>
                        `
                            : ""
                        }
                        <a href="${mapsUrl}" target="_blank" style="
                          padding: 8px 16px;
                          background: #34a853;
                          color: white;
                          text-decoration: none;
                          border-radius: 4px;
                          font-size: 13px;
                        ">Google Maps에서 보기</a>
                      </div>
                    </div>
                  </div>
                `,
              });
              detailWindow.open(map, marker);
            }
          });
        });

        markers.push(marker);
        dayPlaces.push(result.location);

        if (i === 0 && dayIndex === 0) {
          map.setCenter(result.location);
        }
      });

      // 경로 그리기 코드 (polylines)는 그대로 유지
      if (dayPlaces.length >= 2) {
        // 화살표가 있는 단일 경로
        const arrowPolyline = new google.maps.Polyline({
          path: dayPlaces,
          geodesic: true,
          strokeColor: getDayColor(dayIndex),
          strokeOpacity: 0.8,
          strokeWeight: 3,
          icons: [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 5,
                strokeColor: getDayColor(dayIndex),
                strokeWeight: 2,
                fillColor: getDayColor(dayIndex),
                fillOpacity: 1,
              },
              offset: "50%",
              repeat: "100px", // 화살표 간격
            },
          ],
          dayIndex: dayIndex,
          routeInfo: {
            day: dayIndex + 1,
            order: "main",
            places: dayPlaces.map((place, idx) => ({
              lat: place.lat(),
              lng: place.lng(),
              order: idx,
            })),
          },
        });
        // 마우스 오버 효과
        arrowPolyline.addListener("mouseover", function () {
          this.setOptions({
            strokeOpacity: 1,
            strokeWeight: 4,
          });
        });

        arrowPolyline.addListener("mouseout", function () {
          this.setOptions({
            strokeOpacity: 0.8,
            strokeWeight: 3,
          });
        });

        arrowPolyline.setMap(map);
        polylines.push(arrowPolyline);
      }

      // 지도 경계 맞추기
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
      console.log(error);
    });
}
function createMarkerIcon(photo) {
  const iconUrl = photo
    ? photo.getUrl({ maxWidth: 50, maxHeight: 50 })
    : "https://via.placeholder.com/50"; // 기본 이미지 URL

  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: "#FF6B6B", // 색상 설정
    fillOpacity: 1,
    strokeWeight: 0,
    scale: 8,
    icon: {
      url: iconUrl,
      scaledSize: new google.maps.Size(50, 50), // 크기 설정
    },
  };
}

// 정보창 내용 생성
function generateInfoWindowContent(result) {
  return `
    <div style="max-width: 200px;">
      <img src="${
        result.photo
          ? result.photo.getUrl({ maxWidth: 200, maxHeight: 150 })
          : "https://via.placeholder.com/200x150"
      }" style="width: 100%; height: 150px; object-fit: cover;">
      <div style="padding: 10px;">
        <h3 style="margin: 0; color: #333; font-size: 14px; font-weight: 600;">${
          result.name
        }</h3>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 12px; line-height: 1.3;">${
          result.address
        }</p>
      </div>
    </div>
  `;
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
