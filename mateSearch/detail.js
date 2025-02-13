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
    loadComments(postingId); // 댓글 불러오기 추가
  } else {
    console.warn("URL에 postingId가 없습니다.");
    alert("잘못된 접근입니다.");
    window.location.href = "/";
  }

  // 댓글 입력 버튼 클릭 이벤트 추가
  const commentButton = document.getElementById("comment-submit-btn");
  if (commentButton) {
    commentButton.addEventListener("click", async () => {
      const commentContent = document
        .getElementById("comment-content")
        .value.trim();
      if (!commentContent) {
        alert("댓글 내용을 입력해주세요!");
        return;
      }

      const { data: user } = await _supabase.auth.getUser();
      if (!user || !user.id) {
        alert("로그인이 필요합니다!");
        return;
      }

      console.log("✅ 댓글 저장 시도:", {
        post_id: postingId,
        user_id: user.id,
        content: commentContent,
      });

      // 댓글 저장
      saveComment(postingId, commentContent, user.id);
      document.getElementById("comment-content").value = ""; // 입력창 초기화
    });
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

// 댓글 저장 함수
async function saveComment(postingId, content, userId) {
  try {
    const { error } = await _supabase.from("POSTING_COMMENTS").insert([
      {
        post_id: postingId,
        user_id: userId,
        content: content,
      },
    ]);

    if (error) {
      console.error("댓글 저장 실패:", error);
      alert("댓글 작성에 실패했습니다.");
    } else {
      loadComments(postingId); // 댓글 다시 불러오기
    }
  } catch (error) {
    console.error("댓글 저장 중 오류 발생:", error);
    alert("댓글 저장에 실패했습니다.");
  }
}

// 댓글 불러오기 함수
async function loadComments(postingId) {
  const { data: comments, error } = await _supabase
    .from("POSTING_COMMENTS")
    .select("content, created_at, user_id (username)")
    .eq("post_id", postingId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("댓글 불러오기 실패:", error);
    return;
  }

  const commentsContainer = document.getElementById("comments-container");
  if (!commentsContainer) {
    console.warn("댓글 컨테이너를 찾을 수 없습니다.");
    return;
  }

  commentsContainer.innerHTML = ""; // 기존 댓글 삭제 후 다시 추가

  comments.forEach((comment) => {
    const commentElement = document.createElement("div");
    commentElement.classList.add("card", "mb-2", "p-2");

    commentElement.innerHTML = `
      <strong>${comment.user_id.username}</strong> 
      <p>${comment.content}</p>
      <small class="text-muted">${new Date(
        comment.created_at
      ).toLocaleString()}</small>
    `;

    commentsContainer.appendChild(commentElement);
  });
}
