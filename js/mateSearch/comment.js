import { supabase, cmtTable } from "../supabase.js";

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
        Swal.fire({
          icon: "warning",
          text: "댓글 내용을 입력해주세요!",
          confirmButtonText: "확인",
        });
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!data.user || !data.user.id) {
        Swal.fire({
          icon: "warning",
          text: "로그인이 필요합니다!",
          confirmButtonText: "확인",
        });
        return;
      }

      const success = await saveComment(
        postingId,
        commentContent,
        data.user.id
      );
      if (success) {
        document.getElementById("comment-content").value = ""; // 입력창 초기화
        await loadComments(postingId); // 댓글 목록 갱신
      }
    });
  }
});

// 댓글 저장 함수
async function saveComment(postingId, content, userId, parentCommentId = null) {
  try {
    const { error } = await supabase.from(cmtTable).insert([
      {
        post_id: postingId,
        user_id: userId,
        content: content,
        parent_comment_id: parentCommentId,
      },
    ]);

    if (error) {
      console.error("댓글 저장 실패:", error);
      alert("댓글 작성에 실패했습니다.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("댓글 저장 중 오류 발생:", error);
    return false;
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
      await loadComments(postingId);
    }
  } catch (error) {
    console.error("댓글 삭제 중 오류 발생:", error);
  }
}

// 댓글 렌더링 함수 개선
function renderComment(
  comment,
  container,
  currentUser,
  postingId,
  parentCommentId = null
) {
  const commentElement = document.createElement("div");
  commentElement.classList.add("card", "mb-2", "p-2");
  commentElement.setAttribute("data-comment-id", comment.id);

  const username = comment.userinfo?.username || "알 수 없음";

  // 댓글 내용 렌더링
  const commentContentDiv = document.createElement("div");
  commentContentDiv.classList.add("comment-content");
  commentContentDiv.innerHTML = `
    <strong>${username}</strong> 
    <small class="text-muted"> | ${new Date(
      comment.created_at
    ).toLocaleString()} |</small>
    <p>${comment.content}</p>
  `;

  // 답글 버튼 추가 (오직 최상위 댓글에만)
  if (!parentCommentId) {
    const replyButton = document.createElement("button");
    replyButton.textContent = "답글";
    replyButton.classList.add(
      "btn",
      "btn-sm",
      "btn-outline-primary",
      "reply-btn",
      "ms-2"
    );
    replyButton.onclick = () =>
      showReplyForm(comment.id, commentElement, postingId);
    commentContentDiv.appendChild(replyButton);
  }

  // 수정/삭제 버튼 (작성자인 경우에만)
  if (currentUser?.user?.id === comment.user_id) {
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("text-end", "mt-2");

    const editButton = document.createElement("button");
    editButton.textContent = "수정";
    editButton.classList.add("btn", "btn-sm", "btn-outline-secondary", "me-2");
    editButton.onclick = createEditHandler(commentContentDiv, comment);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "삭제";
    deleteButton.classList.add("btn", "btn-sm", "btn-outline-danger");
    deleteButton.onclick = () => deleteComment(comment.id, postingId);

    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(deleteButton);
    commentContentDiv.appendChild(buttonContainer);
  }

  commentElement.appendChild(commentContentDiv);

  // 대댓글 컨테이너 추가
  if (Array.isArray(comment.replies) && comment.replies.length > 0) {
    const repliesContainer = document.createElement("div");
    repliesContainer.classList.add("replies", "ms-4"); // 들여쓰기 추가

    comment.replies.forEach((reply) => {
      renderComment(
        reply,
        repliesContainer,
        currentUser,
        postingId,
        comment.id
      );
    });

    commentElement.appendChild(repliesContainer);
  }

  container.appendChild(commentElement);
  return commentElement;
}

// 댓글 수정 핸들러 생성 함수
function createEditHandler(commentContentDiv, comment) {
  return async () => {
    const commentText = commentContentDiv.querySelector("p");
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
      commentContentDiv.querySelector(".text-end").style.display = "block";
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
      commentContentDiv.querySelector(".text-end").style.display = "block";
    };

    buttonsDiv.appendChild(saveBtn);
    buttonsDiv.appendChild(cancelBtn);

    commentText.style.display = "none";
    commentContentDiv.querySelector(".text-end").style.display = "none";
    commentContentDiv.insertBefore(textarea, commentText);
    commentContentDiv.appendChild(buttonsDiv);
  };
}

// 대댓글 입력 폼 표시 함수
function showReplyForm(parentCommentId, parentElement, postingId) {
  if (!postingId) {
    console.error("❌ showReplyForm 호출 시 postingId가 없습니다.");
    return;
  }

  const replyForm = document.createElement("div");
  replyForm.classList.add("reply-form", "ms-4", "mt-2"); // 들여쓰기 및 위쪽 여백 추가
  replyForm.innerHTML = `
    <textarea class="form-control mb-2" placeholder="답글을 입력하세요"></textarea>
    <div class="d-flex justify-content-end">
      <button class="btn btn-sm btn-primary submit-reply me-2">답글 작성</button>
      <button class="btn btn-sm btn-outline-secondary cancel-reply">취소</button>
    </div>
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

      const success = await saveComment(
        postingId,
        content,
        data.user.id,
        parentCommentId
      );
      if (success) {
        replyForm.remove();
        await loadComments(postingId); // 댓글 목록 갱신
      }
    }
  };

  cancelButton.onclick = () => replyForm.remove();

  // 대댓글 처리를 위한 로직 개선
  let repliesContainer = parentElement.querySelector(".replies");
  if (!repliesContainer) {
    repliesContainer = document.createElement("div");
    repliesContainer.classList.add("replies", "ms-4");
    parentElement.appendChild(repliesContainer);
  }

  // 부모 요소의 replies 컨테이너에 답글 폼 추가
  repliesContainer.appendChild(replyForm);
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

    commentsContainer.innerHTML = ""; // 기존 댓글 초기화

    const { data: currentUser } = await supabase.auth.getUser();

    // 댓글을 ID 기준으로 매핑 (대댓글 처리)
    const commentMap = new Map();
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // 부모 댓글과 대댓글 분리 (심층 중첩 지원)
    const topLevelComments = [];
    const commentChildren = new Map();

    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id);

      if (comment.parent_comment_id) {
        // 대댓글인 경우
        const parentId = comment.parent_comment_id;
        if (!commentChildren.has(parentId)) {
          commentChildren.set(parentId, []);
        }
        commentChildren.get(parentId).push(commentWithReplies);
      } else {
        // 부모 댓글인 경우
        topLevelComments.push(commentWithReplies);
      }
    });

    // 대댓글 중첩 처리
    topLevelComments.forEach((comment) => {
      // 해당 댓글의 대댓글 추가
      const childReplies = commentChildren.get(comment.id) || [];
      comment.replies = childReplies;
    });

    // 부모 댓글을 컨테이너에 렌더링
    topLevelComments.forEach((comment) =>
      renderComment(comment, commentsContainer, currentUser, postingId)
    );
  } catch (error) {
    console.error("댓글 로딩 중 오류 발생:", error);
  }
}

export { loadComments };
