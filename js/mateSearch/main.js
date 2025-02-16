import { supabase, mateTable, ptsTable, matebucketName } from "../supabase.js";
import { fetchTravelStylesAndDisplayCheckboxes } from "./func.js";

import { checkLogin, getProfile, logout } from "../auth.js";

let allPostings = []; // 모든 게시글 데이터를 저장할 변수 (필터링 위해)

async function fetchMatePostingsWithStyles() {
  try {
    const { data: postings, error } = await supabase
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
      content,
      created_at,
      image_url,
      state,
      budget,
    is_domestic,
      styles: ${ptsTable} (
        style_id (
          style_name
        )
      ),
      userInfo: user_id (
        username,
        gender,
        age
      )
    `
      )
      .order("id", { ascending: false }); // 최신글 먼저

    if (error) {
      console.error("게시글 목록 및 스타일 조회 실패:", error);
      // alert("게시글 목록을 불러오는 데 실패했습니다.");
      Swal.fire({
        icon: "error",
        text: "게시글 목록을 불러오는 데 실패했습니다.",
      });
      return;
    }

    allPostings = postings || [];

    const urlParams = new URLSearchParams(window.location.search);
    const postIdsParam = urlParams.get("postIds");

    let postArrayFromUrl = [];

    if (postIdsParam) {
      postArrayFromUrl = postIdsParam.split(",").map((item) => item.trim());
      const sortedPostings = postArrayFromUrl.map((id) =>
        postings.find((post) => Number(post.id) === Number(id))
      );
      displayPostings(sortedPostings);
    } else {
      displayPostings(allPostings); // 최초 게시글 목록 표시 (필터링 전 전체 목록)
    }
  } catch (error) {
    console.error("게시글 목록 및 스타일 조회 중 오류:", error);
    // alert("게시글 목록을 불러오는 중 오류가 발생했습니다.");
    Swal.fire({
      icon: "error",
      text: "게시글 목록을 불러오는 중 오류가 발생했습니다.",
    });
  }
}

async function getPostCommentsCount(postId) {
  try {
    const { count, error } = await supabase
      .from("POSTING_COMMENTS")
      .select("*", { count: "exact", head: true }) // head: true로 실제 데이터는 가져오지 않음
      .eq("post_id", postId);

    if (error) {
      console.error("Error fetching comments count:", error);
      return 0;
    }

    // console.log(`${postId} : ${count}`);
    return count || 0;
  } catch (err) {
    console.error("Error in getPostCommentsCount:", err);
    return 0;
  }
}

const channel = supabase
  .channel("public:POSTING_COMMENTS")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "POSTING_COMMENTS" },
    (payload) => {
      const changedPostId = payload.new?.post_id || payload.old?.post_id;

      if (changedPostId) {
        getPostCommentsCount(changedPostId).then((count) => {
          const commentCountElement = document.getElementById(
            `comment-count-${changedPostId}`
          );
          if (commentCountElement) {
            commentCountElement.textContent = count;
          }
        });
      }
    }
  )
  .subscribe();

function displayPostings(postings) {
  const box = document.querySelector("#box");
  box.innerHTML = ""; // 기존 목록 비우기

  console.log("displayPostings 호출, 표시할 게시글 수:", postings.length);
  if (postings && postings.length > 0) {
    postings.forEach((posting) => {
      // Bootstrap 카드 컬럼 (md 사이즈 이상에서 3개씩 배치)
      const colDiv = document.createElement("div");
      colDiv.classList.add("col-md-4", "mb-4"); // col-md-4 클래스로 3개씩 배치, mb-4는 간격

      const card = document.createElement("div");
      card.classList.add("card");
      colDiv.appendChild(card); // 컬럼 안에 카드 배치

      const imgArea = document.createElement("div");
      imgArea.classList.add("position-relative");
      card.appendChild(imgArea);

      const { data: imageUrlData } = supabase.storage
        .from(matebucketName)
        .getPublicUrl(posting.image_url);
      const imageElement = document.createElement("img");
      imageElement.src = imageUrlData.publicUrl;
      imageElement.classList.add("card-img-top", "object-fit-cover");
      imageElement.style = "height: 225px";
      imageElement.alt = "게시글 이미지";

      // 커서 스타일 추가
      imageElement.style.cursor = "pointer";

      // 클릭 이벤트 추가
      imageElement.addEventListener("click", () => {
        window.location.href = `./detail.html?id=${posting.id}`;
      });
      imgArea.appendChild(imageElement);

      const cardFooter = document.createElement("div");
      cardFooter.classList.add("card-footer", "p-3");
      card.appendChild(cardFooter);

      const titleLink = document.createElement("a");
      titleLink.href = `./detail.html?id=${posting.id}`;
      titleLink.classList.add("card-title-link");
      titleLink.style.textDecoration = "none";

      const statusText = posting.state ? "모집중" : "모집 완료";
      // const isDomesticText = posting.is_domestic ? "국내" : "해외";
      const destinationText = posting.destination;
      const genderText =
        posting.userInfo?.gender === 1
          ? "남"
          : posting.userInfo?.gender === 2
          ? "여"
          : "미제공";
      const ageText = posting.userInfo?.age || "미제공";

      const titleFullElement = document.createElement("h6");
      titleFullElement.classList.add("mb-2");
      titleFullElement.style.fontWeight = 700;
      titleFullElement.textContent = `[${statusText}] ${destinationText} (${genderText}/${ageText})`;

      const MAX_LENGTH = 15;
      const titleElement = document.createElement("p");

      // 댓글 수 추가
      getPostCommentsCount(posting.id).then((count) => {
        // console.log(`display ${posting.id}_comm:${count}`);
        titleElement.style.fontWeight = 300;
        titleElement.textContent =
          posting.title.length > MAX_LENGTH
            ? posting.title.substring(0, MAX_LENGTH) + "..." + ` [${count}]`
            : posting.title + `  [${count}]`;
      });
      titleLink.appendChild(titleFullElement);
      titleLink.appendChild(titleElement);
      cardFooter.appendChild(titleLink);

      const textElement = document.createElement("p");
      textElement.textContent = `${posting.start_date} ~ ${posting.end_date}`;
      textElement.style.fontSize = "0.8em";
      cardFooter.appendChild(textElement);

      const stylesElement = document.createElement("div");
      stylesElement.classList.add("styles-tags", "mt-3");
      if (posting.styles && posting.styles.length > 0) {
        posting.styles.forEach((style) => {
          const styleTag = document.createElement("span");
          styleTag.classList.add("badge", "bg-secondary", "me-1", "mb-1");
          styleTag.textContent = `#${style.style_id.style_name}`;
          stylesElement.appendChild(styleTag);
        });
      }
      cardFooter.appendChild(stylesElement);

      box.appendChild(colDiv); // box에 컬럼(colDiv) 추가 (기존 card 대신)
    });
  } else {
    box.textContent = "등록된 게시글이 없습니다.";
  }
}

function filterPosting(postings, filters) {
  console.log(filters);
  return postings.filter((posting) => {
    // 국내/국외 필터
    if (filters.locationType) {
      // console.log("locationType 필터:", filters.locationType);
      if (filters.locationType === "domestic" && !posting.is_domestic) {
        return false;
      }
      if (filters.locationType === "international" && posting.is_domestic) {
        return false;
      }
    }

    // 지역 검색 필터
    if (filters.destination) {
      console.log(
        "destination 필터:",
        filters.destination,
        "게시글 여행지:",
        posting.destination
      );
      const filterDestinationLower =
        filters.destination && filters.destination.toLowerCase();
      if (
        !posting.destination
          .toLowerCase()
          .includes(filterDestinationLower || "")
      ) {
        return false;
      }
    }

    // 나이 필터
    const age = posting.userInfo?.age;
    const minAgeFilter = filters.minAge ? parseInt(filters.minAge) : 0;
    const maxAgeFilter = filters.maxAge ? parseInt(filters.maxAge) : 999;

    if (age) {
      console.log(
        "나이 필터 범위:",
        minAgeFilter,
        maxAgeFilter,
        "게시글 나이:",
        age
      );
      if (age < minAgeFilter || age > maxAgeFilter) {
        return false;
      }
    }

    // 성별 필터
    if (filters.gender) {
      console.log(
        "gender 필터:",
        filters.gender,
        "게시글 성별:",
        posting.userInfo?.gender
      );
      if (posting.userInfo?.gender !== parseInt(filters.gender)) {
        return false;
      }
    }

    // 날짜 필터
    if (filters.date) {
      console.log("date 필터:", filters.date);
      const filterDate = new Date(filters.date);
      const postingStartDate = new Date(posting.start_date);
      const postingEndDate = new Date(posting.end_date);

      if (!(filterDate >= postingStartDate && filterDate <= postingEndDate)) {
        return false;
      }
    }

    // 여행 스타일 필터
    if (filters.styles && filters.styles.length > 0) {
      console.log(
        "styles 필터:",
        filters.styles,
        "게시글 스타일:",
        posting.styles
      );
      const postingStyles = posting.styles.map(
        (style) => style.style_id.style_name
      );
      if (!filters.styles.every((style) => postingStyles.includes(style))) {
        return false;
      }
    }

    // 모집 상태 필터
    const stateFilter = filters.state; // "all", "true", "false" 중 하나

    // console.log(
    //   "모집 상태 필터: 선택된 값:",
    //   stateFilter,
    //   "게시글 상태:",
    //   posting.state
    // );

    // if (stateFilter === "all") {
    //   return true;
    // } else if (stateFilter === "true") {
    //   return posting.state === true;
    // } else if (stateFilter === "false") {
    //   return posting.state === false;
    // }

    if (stateFilter !== "all") {
      return posting.state === (stateFilter === "true");
    }

    return true; // 모든 필터 통과 시 true 유지
  });
}

// 페이지 로드 시 게시글 목록 불러오기
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

  fetchMatePostingsWithStyles(); // 게시글 목록 및 스타일 정보 가져오는 함수 호출
  fetchTravelStylesAndDisplayCheckboxes("styleFilters");

  document.querySelector("#writeBtn").addEventListener("click", () => {
    // console.log("write");
    window.location.href = "./write.html";
  });

  const applyFiltersBtn = document.querySelector("#applyFiltersBtn");
  applyFiltersBtn.addEventListener("click", () => {
    const baseUrl = "./index.html";
    history.pushState({}, "", baseUrl);

    const locationTypeFilter = document.querySelector(
      "#locationTypeFilter"
    ).value;
    const destinationFilter =
      document.querySelector("#destinationFilter").value;
    const minAgeFilter = document.querySelector("#ageFilterMin").value;
    const maxAgeFilter = document.querySelector("#ageFilterMax").value;
    // const genderFilter = document.querySelector(
    //   'input[name="genderFilter"]:checked'
    // ).value;
    const genderFilter = document.querySelector("#genderFilter").value;
    const dateFilter = document.querySelector("#dateFilter").value;
    const styleFilters = Array.from(
      document.querySelectorAll('#styleFilters input[type="checkbox"]:checked')
    ).map((checkbox) => checkbox.value);
    const stateFilter = document.querySelector("#stateFilter").value;

    // TODO: 예산 추가

    const filters = {
      locationType: locationTypeFilter,
      destination: destinationFilter,
      minAge: minAgeFilter,
      maxAge: maxAgeFilter,
      gender: genderFilter,
      date: dateFilter,
      styles: styleFilters,
      state: stateFilter,
    };

    const filteredPostings = filterPosting(allPostings, filters);
    displayPostings(filteredPostings);
  });

  const resetFiltersBtn = document.querySelector("#resetFiltersBtn");
  resetFiltersBtn.addEventListener("click", () => {
    const baseUrl = "./index.html";
    history.pushState({}, "", baseUrl);

    // document.querySelector(
    //   'input[name="locationTypeFilter"][value=""]'
    // ).checked = true;
    document.querySelector("#locationTypeFilter").value = "";
    document.querySelector("#destinationFilter").value = "";
    document.querySelector("#ageFilterMin").value = "";
    document.querySelector("#ageFilterMax").value = "";
    // document.querySelector(
    //   'input[name="genderFilter"][value=""]'
    // ).checked = true;
    document.querySelector("#genderFilter").value = "";
    document.querySelector("#dateFilter").value = "";
    document
      .querySelectorAll('#styleFilters input[type="checkbox"]')
      .forEach((checkbox) => (checkbox.checked = false));
    document.querySelector("#stateFilter").value = "all";

    displayPostings(allPostings);
  });
});

window.addEventListener("popstate", function (event) {
  location.reload(); // 페이지 강제 새로고침
});
