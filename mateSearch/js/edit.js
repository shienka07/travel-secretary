// matePostingEdit.js
import {
  supabase,
  mateTable,
  tsTable,
  ptsTable,
  matebucketName,
  folderName,
} from "./config.js";
import { fetchTravelStylesAndDisplayCheckboxes } from "./func.js";

import { checkLogin } from "../../js/auth.js";
const islogined = await checkLogin()
if (!islogined){
    window.location.href = "https://aibe-chill-team.github.io/travel-secretary/"
    alert("로그인이 필요합니다");
}

const form = document.querySelector("#editForm");
const cancelBtn = document.querySelector("#cancelWriteBtn");
const imageInput = document.querySelector("#imageUrl");
const imagePreview = document.querySelector("#imagePreview");

// 게시글 수정 관련
const postingService = {
  async checkAuth() {
    const { data: userInfo, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error("인증 오류 발생");
    return userInfo.user.id;
  },

  async uploadImage(file) {
    if (!file) return null;

    const timestamp = new Date().getTime();
    const fileName = `post_image_${timestamp}_${file.name}`;
    const filePath = `${folderName}/${fileName}`;

    try {
      const { data: image, error: uploadError } = await supabase.storage
        .from(matebucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      return image.path;
    } catch (error) {
      console.log("이미지 업로드 중 오류: ", error);
      return;
    }
  },

  async getPosting(postId) {
    const { data, error } = await supabase
      .from(mateTable)
      .select("*")
      .eq("id", postId)
      .single();

    if (error) throw error;
    return data;
  },

  async getPostingStyles(postId) {
    const { data, error } = await supabase
      .from(ptsTable)
      .select(
        `
		  style_id ( style_name )
		`
      )
      .eq("posting_id", postId);

    if (error) throw error;
    return data.map((item) => item.style_id.style_name);
  },

  async updatePosting(postId, postData) {
    try {
      const { error } = await supabase
        .from(mateTable)
        .update(postData)
        .eq("id", postId);

      if (error) throw error;
    } catch (error) {
      console.error("게시글 수정 실패:", error);
      throw error;
    }
  },

  async updateStyles(postId, styles) {
    try {
      // 기존 스타일 연결 삭제
      await supabase.from(ptsTable).delete().eq("posting_id", postId);

      // 새로운 스타일 연결 추가
      for (const styleName of styles) {
        const { data: styleData, error: styleError } = await supabase
          .from(tsTable)
          .select("style_id")
          .eq("style_name", styleName)
          .single();

        if (styleError) {
          console.error(`${styleName} 조회 실패: `, styleError);
          continue;
        }

        if (styleData) {
          await supabase.from(ptsTable).insert([
            {
              posting_id: postId,
              style_id: styleData.style_id,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("스타일 업데이트 실패:", error);
      throw error;
    }
  },
};

// 폼 데이터 채우기
function fillFormData(posting, styles) {
  form.querySelector('[name="title"]').value = posting.title;
  form.querySelector('[name="content"]').value = posting.content;
  form.querySelector('[name="startDate"]').value = posting.start_date;
  form.querySelector('[name="endDate"]').value = posting.end_date;
  form.querySelector('[name="destination"]').value = posting.destination;
  form.querySelector('[name="isDomestic"]').value = posting.is_domestic;
  form.querySelector('[name="people"]').value = posting.people;
  form.querySelector('[name="budget"]').value = posting.budget;

  // 여행 스타일 체크박스
  styles.forEach((style) => {
    const checkbox = form.querySelector(
      `input[name="styles"][value="${style}"]`
    );
    if (checkbox) checkbox.checked = true;
  });

  // 이미지 미리보기
  //   if (posting.image_url && imagePreview) {
  //     imagePreview.innerHTML = `<img src="${posting.image_url}" alt="Preview" style="max-width: 200px;">`;
  //   }
}

// 폼 제출 처리
async function handleSubmit(event, postId) {
  event.preventDefault();

  try {
    await postingService.checkAuth();
    const formData = new FormData(form);

    // 게시글 데이터
    const postData = {
      title: formData.get("title"),
      content: formData.get("content"),
      start_date: formData.get("startDate"),
      end_date: formData.get("endDate"),
      destination: formData.get("destination"),
      is_domestic: formData.get("isDomestic"),
      people: parseInt(formData.get("people")),
      budget: formData.get("budget"),
    };

    // 이미지 업로드
    const imageFile = imageInput.files[0];
    if (imageFile) {
      postData.image_url = await postingService.uploadImage(imageFile);
    }

    // 게시글 수정
    await postingService.updatePosting(postId, postData);

    // 여행 스타일 업데이트
    const styles = formData.getAll("styles");
    if (styles.length > 0) {
      await postingService.updateStyles(postId, styles);
    }

    alert("게시글 수정 완료!");
    window.location.href = `detail.html?id=${postId}`; // TODO
  } catch (error) {
    console.error("게시글 수정 중 오류:", error);
    alert("게시글 수정 중 오류가 발생했습니다.");
  }
}

// 이미지 미리보기
function handleImageChange(event) {
  const file = event.target.files[0];
  if (file && imagePreview) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px;">`;
    };
    reader.readAsDataURL(file);
  }
}

// 초기화
async function initializeEdit(postId) {
  try {
    await postingService.checkAuth();
    await fetchTravelStylesAndDisplayCheckboxes("style-checkboxes");

    // 게시글 데이터 로드
    const [posting, styles] = await Promise.all([
      postingService.getPosting(postId),
      postingService.getPostingStyles(postId),
    ]);

    // 폼에 데이터 채우기
    fillFormData(posting, styles);

    // 이벤트 리스너
    form.addEventListener("submit", (e) => handleSubmit(e, postId));
    cancelBtn.addEventListener("click", () => window.history.back());
    imageInput?.addEventListener("change", handleImageChange);
  } catch (error) {
    console.error("초기화 오류:", error);
    alert("페이지 로드 중 오류가 발생했습니다.");
    window.location.href = "index.html"; // TODO
  }
}

// URL에서 게시글 ID 가져와서 초기화
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

if (!postId) {
  alert("게시글 ID가 필요합니다.");
  window.location.href = "index.html";
} else {
  document.addEventListener("DOMContentLoaded", () => initializeEdit(postId));
}

export { initializeEdit };
