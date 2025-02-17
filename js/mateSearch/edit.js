// matePostingEdit.js
import {
  supabase,
  mateTable,
  tsTable,
  ptsTable,
  matebucketName,
  folderName,
} from "../supabase.js";
import { fetchTravelStylesAndDisplayCheckboxes } from "./func.js";

import { checkLogin, getProfile, logout } from "../auth.js";

const form = document.querySelector("#editForm");
const cancelBtn = document.querySelector("#cancelWriteBtn");
const imageInput = document.querySelector("#imageUrl");
const imagePreview = document.querySelector("#imagePreview");
const DEFAULT_IMAGE_PATH = "/mate/default.png";
let isImageDeleted = false;

// 게시글 수정 관련
const postingService = {
  async checkAuth() {
    const { data: userInfo, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error("인증 오류 발생");
    return userInfo.user.id;
  },

  async uploadImage(file) {
    if (!file) return DEFAULT_IMAGE_PATH;

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
  async getImage(image_url) {
    const { data: imageUrlData } = await supabase.storage
      .from(matebucketName)
      .getPublicUrl(image_url);

    return imageUrlData.publicUrl;
  },
};

// 폼 데이터 채우기
async function fillFormData(posting, styles) {
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

  if (posting.image_url != DEFAULT_IMAGE_PATH) {
    const uploadImage = document.createElement("div");
    uploadImage.classList.add("mb-3", "me-2");
    uploadImage.textContent = "업로드된 이미지: ";
    const image = document.createElement("img");
    image.src = await postingService.getImage(posting.image_url);
    image.style.maxWidth = "200px";
    image.alt = "Preview";
    image.style.verticalAlign = "text-top";

    const deleteA = document.createElement("a");
    deleteA.textContent = "삭제";
    deleteA.href = "#";
    deleteA.classList.add("btn", "btn-danger", "btn-sm");

    deleteA.addEventListener("click", function (event) {
      event.preventDefault();

      uploadImage.style.display = "none"; // 숨기기만 하고 실제로 제거하지 않음
      isImageDeleted = true;
    });

    // 취소 버튼에 대한 이벤트 리스너 추가
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        if (isImageDeleted) {
          uploadImage.style.display = ""; // 이미지 다시 보이게
          isImageDeleted = false;
        }
      });
    }

    uploadImage.appendChild(image);
    uploadImage.appendChild(deleteA);
    imagePreview.appendChild(uploadImage);
  }
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
    } else if (isImageDeleted) {
      postData.image_url = DEFAULT_IMAGE_PATH; // 삭제가 확정될 때만 디폴트 이미지로
    }

    // 게시글 수정
    await postingService.updatePosting(postId, postData);

    // 여행 스타일 업데이트
    const styles = formData.getAll("styles");
    if (styles.length > 0) {
      await postingService.updateStyles(postId, styles);
    }

    // alert("게시글 수정 완료!");
    Swal.fire({
      position: "center",
      icon: "success",
      // title: "게시글 수정이 완료되었습니다.",
      text: "게시글 수정이 완료되었습니다.",
      showConfirmButton: false,
      timer: 1500,
    }).then(() => {
      window.location.href = `./detail.html?id=${postId}`; // TODO
    });
  } catch (error) {
    console.error("게시글 수정 중 오류:", error);
    // alert("게시글 수정 중 오류가 발생했습니다.");
    Swal.fire({
      icon: "error",
      text: "게시글 수정 중 오류가 발생했습니다.",
    });
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

    document
      .getElementById("logout")
      .addEventListener("click", async (event) => {
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
    // alert("페이지 로드 중 오류가 발생했습니다.");
    Swal.fire({
      icon: "error",
      text: "페이지 로드 중 오류가 발생했습니다.",
    }).then(() => {
      window.location.href = "./index.html"; // TODO
    });
  }
}

// URL에서 게시글 ID 가져와서 초기화
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

if (!postId) {
  // alert("게시글 ID가 필요합니다.");
  // window.location.href = "./index.html";
  Swal.fire({
    icon: "warning",
    title: "잘못된 접근입니다",
    onfirmButtonText: "확인",
  }).then(() => {
    window.location.href = "../../index.html"; // 확인 버튼 클릭 시 페이지 이동
  });
} else {
  document.addEventListener("DOMContentLoaded", () => initializeEdit(postId));
}

export { initializeEdit };
