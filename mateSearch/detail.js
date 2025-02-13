import { _supabase, mateTable, tsTable, ptsTable } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. 현재 페이지 URL 가져오기
  const currentURL = window.location.href;
  console.log("현재 URL:", currentURL); // URL 확인 (디버깅 용)

  // 2. URLSearchParams 객체 생성 (URL 파라미터 추출 도구)
  const urlParams = new URLSearchParams(window.location.search);
  console.log("URL 파라미터:", urlParams); // URLSearchParams 객체 확인 (디버깅 용)

  // 3. 'id' 파라미터 값 추출
  const postingId = urlParams.get("id");
  console.log("postingId:", postingId); // 추출된 postingId 값 확인 (디버깅 용)

  if (postingId) {
    console.log(
      `postingId ${postingId} 에 해당하는 게시글 상세 정보 로딩 시작...`
    );
    fetchPostingDetail(postingId);
  } else {
    console.warn("URL에 postingId가 없습니다.");
    alert("잘못된 접근입니다.");
    window.location.href = "/";
  }
});

async function fetchPostingDetail(postingId) {
  try {
    const { data: posting, error } = await _supabase
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
		  image_url,
		  state,
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
      .eq("id", postingId)
      .single();
    if (error) {
      console.error("게시글 상세 정보 조회 실패:", error);
      return null; // 에러 발생 시 null 반환 또는 에러 처리
    }
    // console.log(posting);
    // return posting;
    displayDetails(posting);
  } catch (error) {
    console.error("게시글 상세 정보 조회 중 오류:", error);
    return null; // 예외 발생 시 null 반환 또는 에러 처리
  }
}

function displayDetails(posting) {
  const state = posting.state ? "모집중" : "모집완료";
  document.querySelector(
    "#detail-title"
  ).textContent = `[${state}] ${posting.title}`;

  document.querySelector("#detail-author-username").textContent =
    posting.userInfo.username;

  const genderText =
    posting.userInfo?.gender === 1
      ? "남성"
      : posting.userInfo?.gender === 2
      ? "여성"
      : "미제공"; // 삼항 연산자
  document.querySelector("#detail-author-gender").textContent = genderText;

  document.querySelector(
    "#detail-author-age"
  ).textContent = `${posting.userInfo?.age} 세`;
  document.querySelector("#detail-destination").textContent =
    posting.destination;
  document.querySelector("#detail-people").textContent = `${posting.people} 명`;

  const formattedBudget = posting.budget
    ? parseInt(posting.budget).toLocaleString()
    : "미정";
  document.querySelector("#detail-budget").textContent = formattedBudget;

  document.querySelector(
    "#detail-date"
  ).textContent = `기간: ${posting.start_date} - ${posting.end_date}`;
  document.querySelector("#detail-content").textContent = posting.content;

  const styleTags = document.querySelector("#detail-styles-tags");

  //   console.log(posting.styles);

  if (posting.styles && posting.styles.length > 0) {
    posting.styles.forEach((style) => {
      const styleTag = document.createElement("span");
      styleTag.classList.add("badge", "bg-secondary", "me-1", "mb-1");
      styleTag.textContent = `#${style.style_id.style_name}`;
      styleTags.appendChild(styleTag);
    });
  }

  const dateObject = new Date(`${posting.created_at}`);
  // 날짜 형식 (YYYY. MM. DD.)
  const formattedDatePart = dateObject.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long", // 'short', 'narrow' 도 가능
    day: "numeric",
  });
  // 시간 형식 (오전/오후 HH:mm:ss)
  const formattedTimePart = dateObject.toLocaleTimeString("ko-KR", {
    hour12: true, // 12시간 형식 (true: 오전/오후, false: 24시간)
    hour: "numeric", // 시간
    minute: "numeric", // 분
    second: "numeric", // 초
  });
  const formattedDateTime = `${formattedDatePart} ${formattedTimePart}`;
  document.querySelector("#detail-created-at").textContent = formattedDateTime;
}
