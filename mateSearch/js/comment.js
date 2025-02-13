import { supabase, cmtTable } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postingId = urlParams.get("id");

  if (!postingId) {
    console.warn("댓글 기능: postingId 없음. 댓글 기능을 비활성화합니다.");
    return;
  }

  await loadComments(postingId);

  // 댓글 작성 버튼 클릭 이벤트 추가
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

      const { data } = await supabase.auth.getUser();
      if (!data.user || !data.user.id) {
        alert("로그인이 필요합니다!");
        return;
      }

      await saveComment(postingId, commentContent, data.user.id);
      document.getElementById("comment-content").value = ""; // 입력창 초기화
    });
  }
});

// 댓글 저장 함수
async function saveComment(postingId, content, userId, parentCommentId = null) {
  try {
    const { error } = await supabase.from("POSTING_COMMENTS").insert([
      {
        post_id: postingId,
        user_id: userId,
        content: content,
        parent_comment_id: parentCommentId, // 대댓글이면 부모 댓글 ID 저장
      },
    ]);

    if (error) {
      console.error("댓글 저장 실패:", error);
      alert("댓글 작성에 실패했습니다.");
    } else {
      loadComments(postingId); // 저장 후 댓글 새로 불러오기
    }
  } catch (error) {
    console.error("댓글 저장 중 오류 발생:", error);
  }
}

// 댓글 수정 함수
async function updateComment(commentId, newContent) {
  try {
    const { error } = await supabase
      .from(cmtTable)
      .update({ content: newContent })
      .eq("id", commentId);

    if (error) {
      console.error("댓글 수정 실패:", error);
      alert("댓글 수정에 실패했습니다.");
      return false;
    }
    return true;
  } catch (error) {
    console.error("댓글 수정 중 오류 발생:", error);
    return false;
  }
}

// 댓글 삭제 함수
async function deleteComment(commentId, postingId) {
  try {
    if (!confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      return;
    }

    const { error } = await supabase
      .from(cmtTable)
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("댓글 삭제 실패:", error);
      alert("댓글 삭제에 실패했습니다.");
    } else {
      loadComments(postingId);
    }
  } catch (error) {
    console.error("댓글 삭제 중 오류 발생:", error);
  }
}

function renderComment(comment, container, currentUser) {
  const commentElement = document.createElement("div");
  commentElement.classList.add("card", "mb-2", "p-2");
  commentElement.setAttribute("data-comment-id", comment.id);

  const username = comment.userinfo?.username || "알 수 없음";

  commentElement.innerHTML = `
    <div class="comment-content">
      <strong>${username}</strong> 
      <small class="text-muted"> | ${new Date(
        comment.created_at
      ).toLocaleString()} |</small>
      <p>${comment.content}</p>
      <button class="btn btn-sm btn-outline-primary reply-btn">답글</button>
    </div>
  `;

  const replyButton = commentElement.querySelector(".reply-btn");
  replyButton.onclick = () => showReplyForm(comment.id, commentElement);

  container.appendChild(commentElement);

  // ✅ 대댓글이 있으면 재귀적으로 렌더링
  if (comment.replies.length > 0) {
    const replyContainer = document.createElement("div");
    replyContainer.classList.add("replies");
    comment.replies.forEach((reply) =>
      renderComment(reply, replyContainer, currentUser)
    );
    container.appendChild(replyContainer);
  }
}

// ✅ 대댓글 입력 폼 표시
function showReplyForm(parentCommentId, parentElement) {
  const replyForm = document.createElement("div");
  replyForm.innerHTML = `
    <textarea class="form-control mb-2" placeholder="답글을 입력하세요"></textarea>
    <button class="btn btn-sm btn-primary submit-reply">답글 작성</button>
    <button class="btn btn-sm btn-outline-secondary cancel-reply">취소</button>
  `;

  const submitButton = replyForm.querySelector(".submit-reply");
  const cancelButton = replyForm.querySelector(".cancel-reply");
  const textarea = replyForm.querySelector("textarea");

  submitButton.onclick = async () => {
    const content = textarea.value.trim();
    if (content) {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        alert("로그인이 필요합니다!");
        return;
      }
      await saveComment(postingId, content, data.user.id, parentCommentId);
      replyForm.remove();
    }
  };

  cancelButton.onclick = () => replyForm.remove();

  parentElement.appendChild(replyForm);
}

// 댓글 불러오기 함수
async function loadComments(postingId) {
  try {
    const { data: comments, error } = await supabase
      .from(cmtTable)
      .select(
        `
        id, 
        content, 
        created_at, 
        user_id,
        parent_comment_id,
        userinfo(username)
      `
      )
      .eq("post_id", postingId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("댓글 불러오기 실패:", error);
      return;
    }

    const commentsContainer = document.getElementById("comments-container");
    if (!commentsContainer) {
      console.warn("댓글 컨테이너가 존재하지 않습니다.");
      return;
    }

    commentsContainer.innerHTML = "";

    const { data: currentUser } = await supabase.auth.getUser();

    const topLevelComments = comments.filter((c) => !c.parent_comment_id);

    // ✅ 대댓글 매핑
    const commentMap = {};
    comments.forEach((comment) => {
      commentMap[comment.id] = comment;
      comment.replies = [];
    });

    // ✅ 대댓글을 부모 댓글의 `replies` 배열에 추가
    comments.forEach((comment) => {
      if (comment.parent_comment_id) {
        commentMap[comment.parent_comment_id]?.replies.push(comment);
      }
    });

    // ✅ 일반 댓글을 렌더링하고, 그 아래에 대댓글 표시
    topLevelComments.forEach((comment) =>
      renderComment(comment, commentsContainer, currentUser)
    );

    comments.forEach((comment) => {
      const commentElement = document.createElement("div");
      commentElement.classList.add("card", "mb-2", "p-2");
      commentElement.setAttribute("data-comment-id", comment.id);

      const username = comment.userinfo?.username || "알 수 없음";

      commentElement.innerHTML = `
      <div class="comment-content">
        <strong>${username}</strong><small class="text-muted"> |  ${new Date(
        comment.created_at
      ).toLocaleString()} |</small>
        <p>${comment.content}</p>
      </div>
    `;

      // 수정/삭제 버튼 (작성자인 경우에만)
      if (currentUser?.user?.id === comment.user_id) {
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("text-end", "mt-2");

        const editButton = document.createElement("button");
        editButton.textContent = "수정";
        editButton.classList.add(
          "btn",
          "btn-sm",
          "btn-outline-secondary",
          "me-2"
        );

        editButton.onclick = async () => {
          const commentContent =
            commentElement.querySelector(".comment-content");
          const commentText =
            commentElement.querySelector(".comment-content p");
          const originalContent = commentText.textContent;

          // 수정 모드 UI 생성
          const textarea = document.createElement("textarea");
          textarea.classList.add("form-control", "mb-2");
          textarea.value = originalContent;

          const buttonsDiv = document.createElement("div");
          buttonsDiv.classList.add("text-end", "mt-2");

          const saveBtn = document.createElement("button");
          saveBtn.textContent = "완료";
          saveBtn.classList.add("btn", "btn-sm", "btn-primary", "me-2");

          const cancelBtn = document.createElement("button");
          cancelBtn.textContent = "취소";
          cancelBtn.classList.add("btn", "btn-sm", "btn-outline-secondary");

          // 취소 버튼 클릭 시
          cancelBtn.onclick = () => {
            textarea.remove();
            buttonsDiv.remove();
            commentText.style.display = "block";
            buttonContainer.style.display = "block";
          };

          // 완료 버튼 클릭 시
          saveBtn.onclick = async () => {
            const newContent = textarea.value.trim();
            if (newContent && newContent !== originalContent) {
              const success = await updateComment(comment.id, newContent);
              if (success) {
                commentText.textContent = newContent;
              }
            }
            textarea.remove();
            buttonsDiv.remove();
            commentText.style.display = "block";
            buttonContainer.style.display = "block";
          };

          buttonsDiv.appendChild(saveBtn);
          buttonsDiv.appendChild(cancelBtn);

          commentText.style.display = "none";
          buttonContainer.style.display = "none";
          commentContent.insertBefore(textarea, commentText);
          commentElement.appendChild(buttonsDiv);
        };

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "삭제";
        deleteButton.classList.add("btn", "btn-sm", "btn-outline-danger");
        deleteButton.onclick = () => deleteComment(comment.id, postingId);

        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);
        commentElement.appendChild(buttonContainer);
      }

      commentsContainer.appendChild(commentElement);
    });
  } catch (error) {
    console.error("댓글 로딩 중 오류 발생:", error);
  }
}

export { loadComments };
