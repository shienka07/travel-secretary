import {
  supabase,
  mateTable,
  tsTable,
  ptsTable,
  matebucketName,
  folderName,
} from "./config.js";
import { fetchTravelStylesAndDisplayCheckboxes } from "./func.js";

import { checkLogin,getProfile,logout } from "../../js/auth.js";

const mateForm = document.querySelector("#mateForm");
const cancelBtn = document.querySelector("#cancelWriteBtn");
const imageInput = document.querySelector("#imageUrl");

// 게시글 작성 관련
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

  async createPosting(postData) {
    try {
      const { data: postingData, error: postingError } = await supabase
        .from(mateTable)
        .insert([postData])
        .select("id") // 작성된 게시글의 posting_id만 선택
        .single(); // 단일 결과 반환하도록 지정

      if (postingError) {
        console.error("게시글 작성 실패:", postingError);
        alert("게시글 작성에 실패했습니다.");
        return;
      }
      return postingData.id;
    } catch (error) {
      console.log("게시글 작성 오류: ", error);
      return;
    }
  },

  async linkTravelStyles(postingId, styles) {
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
        const styleId = styleData.style_id;
        const { error: postingStyleError } = await supabase
          .from(ptsTable)
          .insert([
            {
              posting_id: postingId,
              style_id: styleId,
            },
          ]);

        if (postingStyleError) {
          console.error(
            `게시글-스타일 (${styleName}) 연결 실패:`,
            postingStyleError
          );
        }
      }
    }
  },
};

// 폼 제출 처리
async function handleSubmit(event) {
  event.preventDefault();

  try {
    const userId = await postingService.checkAuth();
    const formData = new FormData(mateForm);

    // 게시글 데이터
    const postData = {
      user_id: userId,
      title: formData.get("title"),
      content: formData.get("content"),
      start_date: formData.get("startDate"),
      end_date: formData.get("endDate"),
      destination: formData.get("destination"),
      is_domestic: formData.get("isDomestic"),
      people: parseInt(formData.get("people")),
      budget: formData.get("budget"),
      state: true,
    };

    // 업로드
    const imageFile = imageInput.files[0];
    if (imageFile) {
      postData.image_url = await postingService.uploadImage(imageFile);
    }

    // 게시글 생성
    const postingId = await postingService.createPosting(postData);

    // 여행 스타일 연결
    const styles = formData.getAll("styles");
    if (styles.length > 0) {
      await postingService.linkTravelStyles(postingId, styles);
    }

    alert("게시글 작성 완료!");
    window.location.href = "./index.html"; // TODO
  } catch (error) {
    console.error("게시글 작성 중 오류:", error);
    alert("게시글 작성 중 오류가 발생했습니다.");
  }
}

// 초기화
async function initializePosting() {
  try {
    const islogined = await checkLogin()
    if (!islogined){
        window.location.href = "https://aibe-chill-team.github.io/travel-secretary/"
        alert("로그인이 필요합니다");
    }

    const username = localStorage.getItem("username") || "Guest";
    document.getElementById("username").textContent = username + " 님";

    if(localStorage.getItem("profile_img"))
    {
        const profile_img = "https://frqevnyaghrnmtccnerc.supabase.co/storage/v1/object/public/mate-bucket/"+ localStorage.getItem("profile_img");
        const profile = document.querySelector("#profile");
        profile.src = profile_img;
    }
    else{
        const data = await getProfile();
        const profile_img = "https://frqevnyaghrnmtccnerc.supabase.co/storage/v1/object/public/mate-bucket/"+ data.image_url;
        const profile = document.querySelector("#profile");
        profile.src = profile_img;
    }

    document.getElementById("logout").addEventListener("click", async (event) => {
        event.preventDefault();
        await logout();
        window.location.href = "../index.html"
    });

    document.getElementById("logout").addEventListener("click", async (event) => {
        event.preventDefault();
        await logout();
        window.location.href = "../index.html"
    });

    await postingService.checkAuth();
    await fetchTravelStylesAndDisplayCheckboxes("style-checkboxes");

    mateForm.addEventListener("submit", handleSubmit);
    cancelBtn.addEventListener("click", () => window.history.back());
  } catch (error) {
    console.error("초기화 오류:", error);
    alert("페이지 로드 중 오류가 발생했습니다.");
    window.location.href = "./index.html"; // TODO
  }
}

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", initializePosting);

export { initializePosting, postingService };
