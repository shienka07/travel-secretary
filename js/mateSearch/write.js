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
    const DEFAULT_IMAGE_PATH = "/mate/default.png";

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
      return DEFAULT_IMAGE_PATH;
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
        // alert("게시글 작성에 실패했습니다.");
        Swal.fire({
          icon: "error",
          text: "게시글 작성에 실패했습니다.",
        });

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

function isValidDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    Swal.fire({
      icon: "warning",
      text: "시작 날짜와 종료 날짜를 모두 입력해주세요.",
    });
    // alert("시작 날짜와 종료 날짜를 모두 입력해주세요.");
    return false;
  }

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = new Date().getFullYear();
  const maxAllowedYear = currentYear + 2; // 최대 허용 년도를 현재 년도 + 2년으로 설정

  if (startDateObj > endDateObj) {
    // alert("종료 날짜는 시작 날짜 이후여야 합니다.");
    Swal.fire({
      icon: "warning",
      text: "종료 날짜는 시작 날짜 이후여야 합니다.",
    });
    return false;
  }

  if (startDateObj < today || endDateObj < today) {
    // alert("시작 날짜와 종료 날짜는 오늘 이후로 선택해주세요.");
    Swal.fire({
      icon: "warning",
      text: "시작 날짜와 종료 날짜는 오늘 이후로 선택해주세요.",
    });
    return false;
  }

  if (endDateObj.getFullYear() > maxAllowedYear) {
    // alert(
    //   `최대 허용 년도는 ${maxAllowedYear}년입니다. ${maxAllowedYear}년 이하로 선택해주세요.`
    // );
    Swal.fire({
      icon: "warning",
      text: `최대 허용 년도는 ${maxAllowedYear}년입니다. ${maxAllowedYear}년 이하로 선택해주세요.`,
    });
    return false;
  }

  return true;
}

// 폼 제출 처리
async function handleSubmit(event) {
  console.log("handleSubmit");
  event.preventDefault();

  const formData = new FormData(mateForm);
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");

  // 날짜 유효성 검증
  if (!isValidDateRange(startDate, endDate)) {
    return;
  }

  try {
    const userId = await postingService.checkAuth();

    // 게시글 데이터
    const postData = {
      user_id: userId,
      title: formData.get("title"),
      content: formData.get("content"),
      start_date: startDate,
      end_date: endDate,
      destination: formData.get("destination"),
      is_domestic: formData.get("isDomestic"),
      people: parseInt(formData.get("people")),
      budget: formData.get("budget"),
      state: true,
    };

    // 업로드
    const imageFile = imageInput.files[0];
    postData.image_url = await postingService.uploadImage(imageFile);

    // 게시글 생성
    const postingId = await postingService.createPosting(postData);
    console.log(postingId);

    // 여행 스타일 연결
    const styles = formData.getAll("styles");
    if (styles.length > 0) {
      await postingService.linkTravelStyles(postingId, styles);
    }

    // alert("게시글 작성 완료!");
    Swal.fire({
      position: "center",
      icon: "success",
      text: "게시글이 작성되었습니다.",
      showConfirmButton: false,
      timer: 1500,
    }).then(() => {
      window.location.href = "./index.html";
    });
  } catch (error) {
    console.error("게시글 작성 중 오류:", error);
    // alert("게시글 작성 중 오류가 발생했습니다.");
    Swal.fire({
      icon: "error",
      text: "게시글 작성 중 오류가 발생했습니다.",
    });
  }
}

// 초기화
async function initializePosting() {
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

    mateForm.addEventListener("submit", handleSubmit);
    cancelBtn.addEventListener("click", () => window.history.back());
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

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", initializePosting);

export { initializePosting, postingService };
