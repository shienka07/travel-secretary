// saveRoute.js

import { supabase } from "./supabase.js";

async function saveRouteToSupabase() {
  try {
    // 현재 URL에서 게시글 ID 추출
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");

    if (!postId) {
      throw new Error("게시글 ID를 찾을 수 없습니다.");
    }

    // 마커 위치 데이터 수집
    const locations = markers.map((marker) => ({
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng(),
      label: marker.getLabel(),
      placeInfo: marker.placeInfo || {}, // 장소 상세 정보가 있다면 저장
    }));

    // 경로 데이터 수집
    const routes = collectRouteData().map((dayRoute) => ({
      day: dayRoute.day,
      places: dayRoute.places,
      path: polylines
        .filter((line) => line.dayIndex === dayRoute.day - 1)
        .map((line) =>
          line
            .getPath()
            .getArray()
            .map((point) => ({
              lat: point.lat(),
              lng: point.lng(),
            }))
        ),
    }));

    // Supabase 업데이트
    const { data, error } = await supabase
      .from("MATE_POSTING")
      .update({
        locations: locations,
        routes: routes,
      })
      .eq("id", postId);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("경로 저장 중 오류 발생:", error);

    throw error;
  }
}

// 저장 버튼 이벤트 리스너 등록
document.getElementById("saveRouteBtn").addEventListener("click", async () => {
  try {
    await saveRouteToSupabase();
  } catch (error) {
    console.error("Save failed:", error);
  }
});

// 기존 경로 데이터 로드
async function loadExistingRoute(postId) {
  try {
    const { data, error } = await supabase
      .from("MATE_POSTING")
      .select("locations, routes")
      .eq("id", postId)
      .single();

    if (error) throw error;

    if (data.locations && data.routes) {
      // 기존 마커와 경로 초기화
      clearMap();

      // 저장된 마커 표시
      data.locations.forEach((loc) => {
        const position = new google.maps.LatLng(loc.lat, loc.lng);
        const marker = new google.maps.Marker({
          position: position,
          map: map,
          label: loc.label,
          icon: getMarkerIcon(parseInt(loc.label.split("-")[0]) - 1),
        });
        markers.push(marker);
      });

      // 저장된 경로 표시
      if (data.routes) {
        displayRouteData(data.routes);
        drawAllRoutes();
      }
    }
  } catch (error) {
    console.error("기존 경로 로드 중 오류:", error);
  }
}

// 페이지 로드 시 기존 경로 데이터 로드
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");
  if (postId) {
    loadExistingRoute(postId);
  }
});
