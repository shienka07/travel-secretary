import { getProfile } from "../auth.js";
import { supabase, mateTable, ptsTable } from "../supabase.js";

async function fetchDataFromSupabase() {
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
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Supabase 데이터 로드 실패:", error);
      Swal.fire({
        icon: "error",
        title: "데이터 로드 실패",
        text: "데이터를 불러오는 데 실패했습니다.",
      });
      return null; // 에러 발생 시 null 반환 또는 에러 처리
    }

    // console.log("Supabase 데이터:", postings); // 가져온 데이터 확인 (디버깅)
    return postings; // 성공적으로 데이터 가져오면 데이터 반환
  } catch (error) {
    console.error("Supabase 데이터 로딩 중 오류:", error);
    Swal.fire({
      icon: "error",
      title: "데이터 로드 실패",
      text: "데이터를 불러오는 데 실패했습니다.",
    });
    return null; // 오류 발생 시 null 반환 또는 에러 처리
  }
}

function createSummaryPrompt(postingsData) {
  let context = "";
  if (postingsData && postingsData.length > 0) {
    context += "## 참고 게시글 정보:\n";
    postingsData.forEach((post) => {
      context += `- 게시글 ID ${post.id}:\n`;
      context += `  - 제목: ${post.title}\n`;
      context += `  - 내용: ${post.content}\n`;
      context += `  - 여행지: ${post.destination}\n`;
      context += `  - 기간: ${post.start_date} ~ ${post.end_date}\n`; // 기간 정보 추가
      context += `  - 모집 인원: ${post.people}명\n`; // 모집 인원 추가
      context += `  - 예산: ${post.budget ? post.budget + "원" : "미정"}\n`; // 예산 정보 추가
      context += `  - 국내/국외: ${post.is_domestic ? "국내" : "국외"}\n`; // 국내/국외 정보 추가
      context += `  - 스타일: ${
        post.styles
          .map((style) => "#" + style.style_id.style_name)
          .join(", ") || "없음"
      }\n`; // 스타일 정보 추가
      context += `  - 작성자: ${post.userInfo?.username || "익명"} (성별: ${
        post.userInfo?.gender === 1
          ? "남성"
          : post.userInfo?.gender === 2
          ? "여성"
          : "미제공"
      }, 나이: ${post.userInfo?.age || "미제공"}세, 유저 성향 :  ${
        post.userinfo?.answer || "미제공"
      })\n`; // 작성자 정보 (성별, 나이) 추가
      context += `  - 모집 상태: ${post.state ? "모집중" : "모집 완료"}\n`; // 모집 상태 정보 추가
      context += `\n`;
    });
  } else {
    context += "## 참고할 게시글 정보가 없습니다.\n";
  }

  const prompt = `
				${context}
				## 답변:
				(아래 참고 게시글 ID별로 요약해주세요)
				`;

  let answerFormat = "";
  if (postingsData && postingsData.length > 0) {
    answerFormat += "\n## 답변:\n";
    postingsData.forEach((post) => {
      answerFormat += `- 게시글 ID ${post.id} 요약:\n`;
      answerFormat += `  - \n`;
    });
  }

  return prompt + answerFormat;
}

async function exampleMatchingPromptUsage() {
  const postings = await fetchDataFromSupabase();

  const locationTypeFilter = document.querySelector(
    "#locationTypeFilter"
  ).value;
  let location = "";
  if (locationTypeFilter == "domestic") {
    location = "국내";
  } else if (locationTypeFilter == "international") {
    location = "해외";
  }
  const destinationFilter = document.querySelector("#destinationFilter").value;
  const minAgeFilter = document.querySelector("#ageFilterMin").value;
  const maxAgeFilter = document.querySelector("#ageFilterMax").value;
  const genderFilter = document.querySelector("#genderFilter").value;
  const dateFilter = document.querySelector("#dateFilter").value;
  const styleFilters = Array.from(
    document.querySelectorAll('#styleFilters input[type="checkbox"]:checked')
  ).map((checkbox) => checkbox.value);

  // ✅ 예산 추가
  let gender = genderFilter == 1 ? "남성" : genderFilter == 2 ? "여성" : "전체";
  const filters = {
    locationType: location,
    destination: destinationFilter,
    minAge: minAgeFilter,
    maxAge: maxAgeFilter,
    gender: gender,
    date: dateFilter,
    styles: styleFilters,
  };

  const data = await getProfile();

  const userPreferences = {
    preferredlocationType: filters.locationType,
    preferredDestination: filters.destination,
    preferredAgeRange: { min: filters.minAge, max: filters.maxAge },
    preferredGender: filters.gender,
    prefferedstyles: filters.styles,
    profilecharacter: data,
    //preferredBudgetRange: { min: 200000, max: 4000000 }, // 추후 추가
  };

  // 넘겨줘야할 데이터 summaryPrompt => summarized 가 나오고, userPreferences 이걸 주면 createMatchingprompt로 matching prompt가 나오고 =?

  const summaryPrompt = createSummaryPrompt(postings);

  const url = "https://hulking-powerful-snowplow.glitch.me/";
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      summaryPrompt: summaryPrompt,
      userPreferences: userPreferences,
    }),
    headers: {
      "Content-Type": "Application/json",
    },
  });

  const matching = await response.text();

  const regex = /{([^}]*)}/;

  const match = matching.match(regex);
  console.log(match[0]);
  const parsedData = JSON.parse(match[0]);
  console.log(parsedData.ID);
  const postArray = parsedData.ID.split(",").map((item) => item.trim());
  if (postArray[0] == 0) {
    const error = new Error("매칭실패");
    error.name = "MatchingError";
    throw error;
  }

  const postIdsString = postArray.join(",");
  const baseUrl = "./index.html";
  const urlWithParams = `${baseUrl}?postIds=${postIdsString}`;
  history.pushState({}, "", urlWithParams);

  displayRecommendPost(postArray);
}

async function displayRecommendPost(postArray) {
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
    .in("id", postArray);

  const sortedPostings = postArray.map((id) =>
    postings.find((post) => Number(post.id) === Number(id))
  );

  const box = document.querySelector("#box");
  box.innerHTML = "";
  console.log("displayPostings 호출, 표시할 게시글 수:", postings.length);

  if (postings && postings.length > 0) {
    sortedPostings.forEach((posting) => {
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
        .from("mate-bucket")
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
      titleElement.style.fontWeight = 300;
      titleElement.textContent =
        posting.title.length > MAX_LENGTH
          ? posting.title.substring(0, MAX_LENGTH) + "..."
          : posting.title;
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

let timerInterval;

async function triggerSwal() {
  Swal.fire({
    title: "AI 자동 매칭 진행 중입니다.",
    html: "매칭 이후 자동으로 닫힙니다... <b></b>",
    timer: 60000,
    timerProgressBar: true,
    allowOutsideClick: false, // ← 추가된 옵션
    allowEscapeKey: false, // ESC 키 방지 (선택사항)
    didOpen: async () => {
      // ✅ didOpen에서 비동기 작업 시작
      Swal.showLoading();
      const timer = Swal.getPopup().querySelector("b");

      // 비동기 작업 실행
      try {
        await exampleMatchingPromptUsage();
        Swal.close(); // 작업 완료 시 수동 종료
      } catch (error) {
        if (error.name == "MatchingError") {
          Swal.fire({
            icon: "error",
            title: "매칭 실패",
            text: "조건에 맞는 여행 메이트를 찾지 못했습니다.",
          });
        } else {
          Swal.fire("오류 발생!", "오류가 발생했습니다. 재시도하십시오.");
        }
      }
    },
    willClose: () => {
      clearInterval(timerInterval);
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#testBtn").addEventListener("click", () => {
    triggerSwal();
  });
});
