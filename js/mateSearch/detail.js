import { supabase, mateTable, ptsTable, matebucketName } from "../supabase.js";

import { checkLogin, getProfile, logout } from "../auth.js";

const editBtn = document.querySelector("#edit-btn");
const deleteBtn = document.querySelector("#delete-btn");
const completeBtn = document.querySelector("#complete-btn");
const toggleBtn = document.querySelector("#toggleRouteSectionBtn");

async function getUserInfo() {
  const { data: userInfo, error } = await supabase.auth.getUser();
  if (error) {
    console.log("유저 정보 가져오기 실패: ", error);
    return null;
  }
  return userInfo.user;
}

function setupEventListeners(postingId) {
  document
    .querySelector("#list-btn")
    .addEventListener("click", () => redirectToPage("./index.html"));
  editBtn.addEventListener("click", () =>
    redirectToPage(`./edit.html?id=${postingId}`)
  );
  deleteBtn.addEventListener("click", () => {
    Swal.fire({
      // title: "게시글을 삭제하시겠습니까?",
      text: "게시글을 삭제하시겠습니까?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
    }).then((result) => {
      if (result.isConfirmed) {
        handleDelete(postingId);
      }
    });
  });

  completeBtn.addEventListener("click", () => {
    Swal.fire({
      // title: "모집 완료 처리하시겠습니까?",
      text: "모집 완료 처리하시겠습니까?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
    }).then((result) => {
      if (result.isConfirmed) {
        handleComplete(postingId);
      }
    });
  });
}

async function handleComplete(postingId) {
  try {
    const { error: completeError } = await supabase
      .from(mateTable)
      .update({ state: false })
      .eq("id", postingId);

    if (completeError) {
      console.error("모집완료 처리 실패: ", completeError);
      return;
    }
    console.log("모집완료 처리 성공: ", postingId);
    window.location.reload();
  } catch (error) {
    console.error("모집 완료 처리 중 오류: ", error);
  }
}

async function handleDelete(postingId) {
  try {
    const { error: deleteError } = await supabase
      .from(mateTable)
      .delete()
      .eq("id", postingId);
    if (deleteError) {
      console.error("게시글 삭제 실패: ", deleteError);
      return;
    }
    // console.log("게시글 삭제 성공: ", postingId);
    // redirectToPage("./index.html");

    Swal.fire({
      icon: "success",
      text: "게시글이 삭제되었습니다.", // 메시지
      showConfirmButton: false,
      timer: 1500,
    }).then(() => {
      redirectToPage("./index.html");
    });
  } catch (error) {
    console.error("게시글 삭제 중 오류: ", error);
  }
}

function redirectToPage(url) {
  window.location.href = url;
}

async function fetchPostingDetail(postingId, userId) {
  console.log(postingId);
  try {
    const { data: posting, error } = await supabase
      .from(mateTable)
      .select(
        ` 
		  id,
		  user_id,
		  title,
		  destination,
		  start_date,
		  end_date,
		  people,
		  budget,
		  content,
		  created_at,
      updated_at,
		  image_url,
      locations,
      routes,
		  state,
		  styles: ${ptsTable} (  
			style_id (
			  style_name
			)
		  ),
		  userInfo: user_id ( 
			username,
			gender,
			age,
      image_url
		  )
		`
      )
      .eq("id", postingId)
      .single();
    if (error) {
      console.error("게시글 상세 정보 조회 실패:", error);
      return null;
    }
    // console.log(posting);
    displayDetails(posting);

    if (posting.user_id === userId) {
      editBtn.removeAttribute("hidden");
      deleteBtn.removeAttribute("hidden");
      toggleBtn.removeAttribute("hidden");

      if (posting.state) {
        completeBtn.removeAttribute("hidden");
      }
    }
  } catch (error) {
    console.error("게시글 상세 정보 조회 중 오류:", error);
  }
}

function displayDetails(posting) {
  const state = posting.state ? "모집중" : "모집완료";
  document.querySelector(
    "#detail-title"
  ).textContent = `[${state}] ${posting.title}`;

  document.querySelector("#detail-author-username").textContent =
    posting.userInfo.username;

  // console.log("image_url", posting.userInfo.image_url);
  const authorImageArea = document.querySelector("#detail-author-image-area");
  if (posting.userInfo.image_url) {
    const profileImage = document.createElement("img");
    const { data } = supabase.storage
      .from(matebucketName)
      .getPublicUrl(posting.userInfo.image_url);

    profileImage.src = data.publicUrl;
    profileImage.alt = "Profile Image";
    profileImage.width = 32;
    profileImage.height = 32;
    profileImage.className = "rounded-circle";

    authorImageArea.appendChild(profileImage);
  } else {
    authorImageArea.innerHTML = `<i class="bi bi-person-circle me-2" style="font-size: 1.5rem"></i> `;
  }

  const genderText =
    posting.userInfo?.gender === 1
      ? "남성"
      : posting.userInfo?.gender === 2
      ? "여성"
      : "미제공";
  document.querySelector("#detail-author-gender").textContent = genderText;

  const imageArea = document.querySelector("#detail-image-area");

  imageArea.innerHTML = "";

  if (posting.image_url) {
    const { data: imageUrlData } = supabase.storage
      .from(matebucketName)
      .getPublicUrl(posting.image_url);

    const imageElement = document.createElement("img");
    imageElement.src = imageUrlData.publicUrl;
    imageElement.alt = "게시글 이미지";
    imageElement.classList.add("img-fluid", "w-100");
    imageElement.style.maxHeight = "500px";
    imageElement.style.objectFit = "contain";
    imageArea.appendChild(imageElement);
  }

  document.querySelector(
    "#detail-author-age"
  ).textContent = `${posting.userInfo?.age} 세`;
  document.querySelector("#detail-destination").textContent =
    posting.destination;
  document.querySelector("#detail-people").textContent = `${posting.people} 명`;

  const formattedBudget = posting.budget
    ? parseInt(posting.budget).toLocaleString() + "만원"
    : "미정";
  document.querySelector("#detail-budget").textContent = formattedBudget;

  document.querySelector(
    "#detail-date"
  ).textContent = `${posting.start_date} - ${posting.end_date}`;
  document.querySelector("#detail-content").innerHTML = posting.content.replace(
    /\n/g,
    "<br>"
  );

  const styleTags = document.querySelector("#detail-styles-tags");
  if (posting.styles && posting.styles.length > 0) {
    posting.styles.forEach((style) => {
      const styleTag = document.createElement("span");
      styleTag.classList.add("badge", "bg-secondary", "me-1", "mb-1");
      styleTag.textContent = `#${style.style_id.style_name}`;
      styleTags.appendChild(styleTag);
    });
  }

  const date = document.querySelector("#detail-created-at");
  if (posting.created_at === posting.updated_at) {
    date.textContent = getFormattedDateTime(posting.created_at);
  } else {
    date.textContent = getFormattedDateTime(posting.updated_at) + " 수정됨";
  }
}

function getFormattedDateTime(dateString) {
  const date = new Date(dateString);
  return (
    `${date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })} ` +
    `${date.toLocaleTimeString("ko-KR", {
      hour12: true,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })}`
  );
}

async function initializePage() {
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
  document.getElementById("username").textContent = username + " 님";

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

  const urlParams = new URLSearchParams(window.location.search);
  const postingId = urlParams.get("id");

  // if (!postingId) {
  //   alert("잘못된 접근입니다.");
  //   redirectToPage("../index.html"); // 수정
  //   return;
  // }
  // console.log("postingId:", postingId); // 추출된 postingId 값 확인 (디버깅 용)
  if (!postingId) {
    Swal.fire({
      icon: "warning",
      title: "잘못된 접근입니다",
      onfirmButtonText: "확인",
    }).then(() => {
      window.location.href = "../index.html"; // 확인 버튼 클릭 시 페이지 이동
    });
  }
  setupRouteSaveButton();

  const user = await getUserInfo();
  if (!user) return;
  setupEventListeners(postingId);
  fetchPostingDetail(postingId, user.id);
  await loadSavedRoutes(postingId); // 저장된 경로 데이터 로드
}

// 지도 로직 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// detail.js에 추가할 코드

// 저장 버튼 이벤트 리스너 설정
function setupRouteSaveButton() {
  const saveRouteBtn = document.getElementById("saveRouteBtn");
  if (saveRouteBtn) {
    saveRouteBtn.addEventListener("click", handleRouteSave);
  }
}

document.addEventListener("DOMContentLoaded", initializePage);
// 지도 로직 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 종료
// detail.js에 추가
async function handleRouteSave() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const postingId = urlParams.get("id");

    if (!postingId) {
      throw new Error("게시글 ID를 찾을 수 없습니다.");
    }

    // 마커 위치 데이터 수집
    const locations = markers.map((marker) => ({
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng(),
      label: marker.getLabel(),
      placeInfo: marker.placeInfo || {},
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
      .from(mateTable)
      .update({
        locations: locations,
        routes: routes,
      })
      .eq("id", postingId);

    if (error) throw error;

    // alert("여행 경로가 성공적으로 저장되었습니다.");
    Swal.fire({
      position: "center",
      icon: "success",
      title: "여행 경로가 성공적으로 저장되었습니다.",
      showConfirmButton: false,
      timer: 1500,
    });
    console.log("저장된 데이터:", { locations, routes });
  } catch (error) {
    console.error("경로 저장 중 오류 발생:", error);
    // alert("경로 저장 중 오류가 발생했습니다: " + error.message);
    Swal.fire({
      icon: "error",
      // title: "Oops...",
      text: "경로 저장 중 오류가 발생했습니다",
    });
  }
}

// 저장된 경로 데이터 로드
async function loadSavedRoutes(postingId) {
  try {
    const { data, error } = await supabase
      .from(mateTable)
      .select("locations, routes")
      .eq("id", postingId)
      .single();
    if (error) throw error;
    if (data.locations && data.routes) {
      // 기존 마커와 경로 초기화
      clearMap();
      // 저장된 마커 표시
      data.locations.forEach((loc) => {
        const position = new google.maps.LatLng(loc.lat, loc.lng);

        // Add safety checks for label
        const label =
          typeof loc.label === "string"
            ? loc.label
            : `Day${loc.dayIndex + 1}-${loc.orderIndex + 1}`;

        const marker = new google.maps.Marker({
          position: position,
          map: map,
          label: {
            text: label,
            color: "#FFFFFF",
            fontSize: "11px",
            fontWeight: "bold",
            className: "marker-label",
          },
          placeInfo: loc.placeInfo,
          icon: getMarkerIcon(
            typeof label === "string"
              ? parseInt(label.split("-")[0].replace("Day", "")) - 1
              : loc.dayIndex
          ),
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
