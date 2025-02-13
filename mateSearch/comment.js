import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postingId = urlParams.get("id");

  if (!postingId) {
    console.warn("❌ 댓글 기능: postingId 없음. 댓글 기능을 비활성화합니다.");
    return;
  }

  console.log("✅ 댓글 기능 활성화. 게시글 ID:", postingId);

  await loadComments(postingId);

  // ✅ 댓글 작성 버튼 클릭 이벤트 추가
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

      const { data: user } = await supabase.auth.getUser();
      if (!user || !user.id) {
        alert("로그인이 필요합니다!");
        return;
      }

      console.log("✅ 댓글 저장 시도:", {
        post_id: postingId,
        user_id: user.id,
        content: commentContent,
      });

      await saveComment(postingId, commentContent, user.id);
      document.getElementById("comment-content").value = ""; // 입력창 초기화
    });
  }
});

// ✅ 댓글 저장 함수
async function saveComment(postingId, content, userId) {
  try {
    const { error } = await supabase.from("POSTING_COMMENTS").insert([
      {
        post_id: postingId,
        user_id: userId,
        content: content,
      },
    ]);

    if (error) {
      console.error("❌ 댓글 저장 실패:", error);
      alert("댓글 작성에 실패했습니다.");
    } else {
      console.log("✅ 댓글 저장 성공!");
      loadComments(postingId);
    }
  } catch (error) {
    console.error("❌ 댓글 저장 중 오류 발생:", error);
  }
}

// ✅ 댓글 불러오기 함수
async function loadComments(postingId) {
  const { data: comments, error } = await supabase
    .from("POSTING_COMMENTS")
    .select("content, created_at, user_id (username)")
    .eq("post_id", postingId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ 댓글 불러오기 실패:", error);
    return;
  }

  console.log("✅ 불러온 댓글 데이터:", comments);

  const commentsContainer = document.getElementById("comments-container");
  if (!commentsContainer) {
    console.warn("⚠️ 댓글 컨테이너가 존재하지 않습니다.");
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
