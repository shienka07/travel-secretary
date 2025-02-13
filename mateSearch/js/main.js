import {
  supabase,
  mateTable,
  tsTable,
  ptsTable,
  matebucketName,
} from "./config.js";
import { fetchTravelStylesAndDisplayCheckboxes } from "./func.js";

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
      .order("created_at", { ascending: false }); // 최신글 먼저

    if (error) {
      console.error("게시글 목록 및 스타일 조회 실패:", error);
      alert("게시글 목록을 불러오는 데 실패했습니다.");
      return;
    }

    allPostings = postings || [];
    displayPostings(allPostings); // 최초 게시글 목록 표시 (필터링 전 전체 목록)
  } catch (error) {
    console.error("게시글 목록 및 스타일 조회 중 오류:", error);
    alert("게시글 목록을 불러오는 중 오류가 발생했습니다.");
  }
}

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

      const cardBody = document.createElement("div");
      cardBody.classList.add("card-body");
      card.appendChild(cardBody);

      const row = document.createElement("div");
      row.classList.add("row", "g-0");
      cardBody.appendChild(row);

      const imageCol = document.createElement("div");
      imageCol.classList.add("col-md-4");
      row.appendChild(imageCol);

      const imageArea = document.createElement("div");
      imageArea.classList.add("image-area", "p-3");
      imageCol.appendChild(imageArea);

      // storage에서 이미지 가져오기
      if (posting.image_url) {
        const { data: imageUrlData } = supabase.storage
          .from(matebucketName)
          .getPublicUrl(posting.image_url);

        const imageElement = document.createElement("img");
        imageElement.src = imageUrlData.publicUrl;
        imageElement.alt = "게시글 이미지";
        imageElement.classList.add("img-fluid", "rounded");
        imageArea.appendChild(imageElement);
      } else {
        imageArea.innerHTML = '<div class="image-placeholder rounded"></div>';
        const placeholder = imageArea.querySelector(".image-placeholder");
        placeholder.classList.add(
          "bg-light",
          "d-flex",
          "justify-content-center",
          "align-items-center",
          "p-4"
        );
        placeholder.style.height = "150px";
        placeholder.textContent = "No Image";
      }

      const infoCol = document.createElement("div");
      infoCol.classList.add("col-md-8");
      row.appendChild(infoCol);

      const infoArea = document.createElement("div");
      infoArea.classList.add("info-area", "p-3");
      infoCol.appendChild(infoArea);

      const authorInfoElement = document.createElement("p");
      const genderText =
        posting.userInfo?.gender === 1
          ? "남성"
          : posting.userInfo?.gender === 2
          ? "여성"
          : "미제공"; // 삼항 연산자
      authorInfoElement.innerHTML = `성별: ${genderText}  | 나이: ${
        posting.userInfo?.age || "미제공"
      }`;
      infoArea.appendChild(authorInfoElement);

      const destinationElement = document.createElement("p");
      destinationElement.textContent = `여행지: ${posting.destination}`;
      infoArea.appendChild(destinationElement);

      const peopleElement = document.createElement("p");
      peopleElement.textContent = `모집인원수: ${posting.people} 명`;
      infoArea.appendChild(peopleElement);

      const budgetElement = document.createElement("p");
      const formattedBudget = posting.budget
        ? parseInt(posting.budget).toLocaleString()
        : "미정"; // 숫자로 변환 후 포맷팅, 아니면 '미정'
      budgetElement.textContent = `예산: ${formattedBudget}`; // '원' 또는 통화 단위 추가 가능
      infoArea.appendChild(budgetElement);

      const dateElement = document.createElement("p");
      dateElement.textContent = `기간: ${posting.start_date} ~ ${posting.end_date}`;
      infoArea.appendChild(dateElement);

      const cardFooter = document.createElement("div");
      cardFooter.classList.add("card-footer", "p-3");
      card.appendChild(cardFooter);
      // ------------------------------------------------------------✅ 경로 확인 필요
      const titleLink = document.createElement("a");
      titleLink.href = `./detail.html?id=${posting.id}`;
      titleLink.classList.add("card-title-link");
      titleLink.style.textDecoration = "none";

      const statusText = posting.state ? "[모집중]" : "[모집 완료]";

      const titleFullElement = document.createElement("h5");
      titleFullElement.classList.add("card-title", "mb-2");
      titleFullElement.textContent = `${statusText} `;

      const titleElement = document.createElement("span");
      titleElement.textContent = posting.title;
      titleFullElement.appendChild(titleElement);
      titleLink.appendChild(titleFullElement);
      cardFooter.appendChild(titleLink);

      const contentElement = document.createElement("p");
      contentElement.classList.add("card-text");
      contentElement.textContent = posting.content;
      cardFooter.appendChild(contentElement);

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
      console.log("locationType 필터:", filters.locationType);
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
      if (!filters.styles.some((style) => postingStyles.includes(style))) {
        return false;
      }
    }

    // 모집 상태 필터
    const isOpenStatusChecked =
      document.getElementById("statusOpenFilter").checked;
    const isClosedStatusChecked =
      document.getElementById("statusClosedFilter").checked;
    console.log(
      "모집 상태 필터: 오픈:",
      isOpenStatusChecked,
      "마감:",
      isClosedStatusChecked,
      "게시글 상태:",
      posting.state
    );
    if (!isOpenStatusChecked && !isClosedStatusChecked) {
      return true; //  모집 상태 필터 무시 (둘 다 체크 X)
    }
    if (isOpenStatusChecked && !posting.state) {
      return false;
    }
    if (isClosedStatusChecked && posting.state) {
      return false;
    }

    return true; // 모든 필터 통과 시 true 유지
  });
}

// 페이지 로드 시 게시글 목록 불러오기
document.addEventListener("DOMContentLoaded", () => {
  fetchMatePostingsWithStyles(); // 게시글 목록 및 스타일 정보 가져오는 함수 호출
  fetchTravelStylesAndDisplayCheckboxes("styleFilters");

  document.querySelector("#writeBtn").addEventListener("click", () => {
    console.log("write");
    window.location.href = "./write.html";
  });

  const applyFiltersBtn = document.querySelector("#applyFiltersBtn");
  applyFiltersBtn.addEventListener("click", () => {
    const locationTypeFilter = document.querySelector(
      'input[name="locationTypeFilter"]:checked'
    ).value;
    const destinationFilter =
      document.querySelector("#destinationFilter").value;
    const minAgeFilter = document.querySelector("#ageFilterMin").value;
    const maxAgeFilter = document.querySelector("#ageFilterMax").value;
    const genderFilter = document.querySelector(
      'input[name="genderFilter"]:checked'
    ).value;
    const dateFilter = document.querySelector("#dateFilter").value;
    const styleFilters = Array.from(
      document.querySelectorAll('#styleFilters input[type="checkbox"]:checked')
    ).map((checkbox) => checkbox.value);

    // ✅ 예산 추가

    const filters = {
      locationType: locationTypeFilter,
      destination: destinationFilter,
      minAge: minAgeFilter,
      maxAge: maxAgeFilter,
      gender: genderFilter,
      date: dateFilter,
      styles: styleFilters,
    };

    const filteredPostings = filterPosting(allPostings, filters);
    displayPostings(filteredPostings);
  });

  const resetFiltersBtn = document.querySelector("#resetFiltersBtn");
  resetFiltersBtn.addEventListener("click", () => {
    document.querySelector(
      'input[name="locationTypeFilter"][value=""]'
    ).checked = true;
    document.querySelector("#destinationFilter").value = "";
    document.querySelector("#ageFilterMin").value = "";
    document.querySelector("#ageFilterMax").value = "";
    document.querySelector(
      'input[name="genderFilter"][value=""]'
    ).checked = true;
    document.querySelector("#dateFilter").value = "";
    document
      .querySelectorAll('#styleFilters input[type="checkbox"]')
      .forEach((checkbox) => (checkbox.checked = false));
    document.querySelector("#statusOpenFilter").checked = true;
    document.querySelector("#statusClosedFilter").checked = false;

    displayPostings(allPostings);
  });
});
