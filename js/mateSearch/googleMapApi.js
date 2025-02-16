// googleMapApi.js

// 전역 변수 선언
let map;
let geocoder;
let markers = [];
let polylines = [];
let markerClusterer;

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
  // 입력된 장소가 있는지 확인
  let hasValidInputs = false;
  const allLocations = []; // 모든 마커의 위치를 저장할 배열

  daySections.forEach((section) => {
    const inputs = section.querySelectorAll(".place-input");
    inputs.forEach((input) => {
      if (input.value.trim()) {
        hasValidInputs = true;
      }
    });
  });

  if (hasValidInputs) {
    daySections.forEach((section, dayIndex) => {
      drawRouteForDay(section, dayIndex, allLocations);
    });
    fitMapToMarkers(allLocations); // 모든 마커의 경계를 맞추기
  }
}

// function fitMapToMarkers() {
//   const bounds = new google.maps.LatLngBounds();
//   markers.forEach((marker) => bounds.extend(marker.getPosition()));
//   map.fitBounds(bounds);

//   // 줌 레벨이 너무 가깝거나 멀어지는 것을 방지
//   const zoom = map.getZoom();
//   if (zoom > 15) map.setZoom(15);
//   if (zoom < 7) map.setZoom(7);
// }

// 지도 경계를 모든 마커에 맞춰 조정
// 지도 경계를 모든 마커에 맞춰 조정
function fitMapToMarkers(locations) {
  if (locations.length === 0) return;

  const bounds = new google.maps.LatLngBounds(); // 경계를 위한 LatLngBounds 객체 생성
  locations.forEach((location) => bounds.extend(location)); // 모든 마커의 위치를 경계에 추가

  map.fitBounds(bounds); // 경계 맞추기

  // 지도 줌 레벨을 적절히 조정
  google.maps.event.addListenerOnce(map, "bounds_changed", function () {
    const zoom = map.getZoom();
    const latDiff = Math.abs(
      bounds.getNorthEast().lat() - bounds.getSouthWest().lat()
    );
    const lngDiff = Math.abs(
      bounds.getNorthEast().lng() - bounds.getSouthWest().lng()
    );

    // 거리 차이가 큰 경우 더 많이 축소
    let adjustedZoom = zoom;

    if (latDiff > 50 || lngDiff > 50) {
      adjustedZoom = Math.min(zoom + 1, 4); // 대륙 간 이동 등 큰 차이에서 더 많이 축소
    } else if (latDiff > 30 || lngDiff > 30) {
      adjustedZoom = Math.min(zoom + 2, 6); // 큰 거리 차이에서 더 많이 축소
    } else if (latDiff > 15 || lngDiff > 15) {
      adjustedZoom = Math.min(zoom + 3, 8); // 보통 크기의 거리 차이에서 축소
    }

    // 최소 줌 레벨 설정
    if (adjustedZoom < 2) {
      adjustedZoom = 2;
    }

    map.setZoom(adjustedZoom);
  });
}

function drawAllRoutes() {
  clearMap();
  const daySections = document.querySelectorAll(".day-inputs");
  let hasValidInputs = false;
  const allLocations = []; // 모든 마커의 위치를 저장할 배열

  daySections.forEach((section) => {
    const inputs = section.querySelectorAll(".place-input");
    inputs.forEach((input) => {
      if (input.value.trim()) {
        hasValidInputs = true;
      }
    });
  });

  if (hasValidInputs) {
    daySections.forEach((section, dayIndex) => {
      drawRouteForDay(section, dayIndex, allLocations);
    });
    fitMapToMarkers(allLocations); // 모든 마커의 경계를 맞추기
  }
}

function drawAllRoutes() {
  clearMap();
  const daySections = document.querySelectorAll(".day-inputs");
  let hasValidInputs = false;
  const allLocations = []; // 모든 마커의 위치를 저장할 배열

  daySections.forEach((section) => {
    const inputs = section.querySelectorAll(".place-input");
    inputs.forEach((input) => {
      if (input.value.trim()) {
        hasValidInputs = true;
      }
    });
  });

  if (hasValidInputs) {
    daySections.forEach((section, dayIndex) => {
      drawRouteForDay(section, dayIndex, allLocations);
    });
    fitMapToMarkers(allLocations); // 모든 마커의 경계를 맞추기
  }
}

// drawRouteForDay 함수 수정
// drawRouteForDay 함수 수정
function drawRouteForDay(section, dayIndex, allLocations) {
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
            allLocations.push(location); // 모든 마커의 위치 추가

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

        // 카메라 마커시작시점 고정
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
          strokeOpacity: 1.0,
          strokeWeight: 6,
          icons: [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 8,
                strokeColor: getDayColor(dayIndex),
                strokeWeight: 4,
                fillColor: getDayColor(dayIndex),
                fillOpacity: 1,
              },
              offset: "50%",
              repeat: "120px", // 화살표 간격
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

        // 여기에 그림자 효과를 위한 새로운 코드 추가
        const shadowPolyline = new google.maps.Polyline({
          path: dayPlaces,
          geodesic: true,
          strokeColor: "#000000",
          strokeOpacity: 0.2,
          strokeWeight: 7,
          offset: "2px",
          zIndex: 1,
        });
        shadowPolyline.setMap(map);

        // 메인 폴리라인의 zIndex 설정
        arrowPolyline.setOptions({
          zIndex: 2,
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
      if (markers.length > 0) {
        if (markerClusterer) {
          markerClusterer.clearMarkers();
        }

        markerClusterer = new markerClusterer.MarkerClusterer({
          map,
          markers,
          algorithm: new markerClusterer.SuperClusterAlgorithm({
            radius: 60,
            maxZoom: 15,
          }),
          renderer: {
            render: ({ count, position }) => {
              return new google.maps.Marker({
                position,
                label: {
                  text: String(count),
                  color: "white",
                  fontSize: "13px",
                  fontWeight: "bold",
                },
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: "#4285F4",
                  fillOpacity: 0.9,
                  strokeWeight: 2,
                  strokeColor: "#FFFFFF",
                  scale: count < 10 ? 20 : count < 100 ? 24 : 28,
                },
                zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
              });
            },
          },
        });
      }
      // 지도 경계 맞추기
      if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();

        // 모든 마커의 위치를 경계에 추가
        markers.forEach((marker) => {
          bounds.extend(marker.getPosition());
        });

        // 중심점 계산
        const center = bounds.getCenter();
        map.setCenter(center);

        // 경계에 여유 공간 추가하고 맞추기
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        // 위도/경도 차이 계산
        const latDiff = Math.abs(ne.lat() - sw.lat());
        const lngDiff = Math.abs(ne.lng() - sw.lng());

        // 거리가 먼 경우(대륙간 이동 등) 더 많은 여백 추가
        const padding = latDiff > 50 || lngDiff > 50 ? 0.3 : 0.2; // 50도 이상 차이나면 30% 여백, 아니면 20% 여백

        const newBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(
            sw.lat() - latDiff * padding,
            sw.lng() - lngDiff * padding
          ),
          new google.maps.LatLng(
            ne.lat() + latDiff * padding,
            ne.lng() + lngDiff * padding
          )
        );

        map.fitBounds(newBounds);

        // 줌 레벨 자동 조정
        google.maps.event.addListenerOnce(map, "bounds_changed", function () {
          const zoom = map.getZoom();

          // 대륙간 이동의 경우 최소 줌 레벨 조정
          if (latDiff > 50 || lngDiff > 50) {
            if (zoom > 4) map.setZoom(4); // 대륙간 이동시 더 넓은 시야
          } else {
            if (zoom > 16) map.setZoom(16); // 일반적인 경우
          }

          // 최소 줌 레벨 설정
          if (zoom < 2) map.setZoom(2);
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
  if (markerClusterer) {
    markerClusterer.clearMarkers();
  }
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
    "#FF3366", // 선명한 분홍
    "#33CC33", // 선명한 초록
    "#3366FF", // 선명한 파랑
    "#FF9933", // 선명한 주황
    "#9933FF", // 선명한 보라
    "#33CCCC", // 선명한 청록
    "#FF6633", // 선명한 주홍
    "#6633FF", // 선명한 남색
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
