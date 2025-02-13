import {
  supabase,
  mateTable,
  tsTable,
  ptsTable,
  matebucketName,
  folderName,
} from "./config.js";
import { fetchTravelStylesAndDisplayCheckboxes } from "./func.js";

/*
mate_posting
   id
   user_id
   title
   content
   start_date
   end_date
   destination
   is_domestic
   people
   budget
   state
   image_url

posting_travel_styles
   id
   posting_id
   style_id
*/

const { userInfo, error: authError } = await supabase.auth.getUser();
console.log("userInfo", userInfo);

fetchTravelStylesAndDisplayCheckboxes("style-checkboxes");

const mateForm = document.querySelector("#mateForm");
mateForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(mateForm);
  const writeData = {
    // user_id: userInfo.id;
    user_id: "e4b9ac83-a020-454a-9b75-5462937cf057", // ✅ 임시... 로그인아이디 받아오기
    title: formData.get("title"),
    content: formData.get("content"),
    start_date: formData.get("startDate"),
    end_date: formData.get("endDate"),
    destination: formData.get("destination"),
    is_domestic: formData.get("isDomestic"),
    people: parseInt(formData.get("people")),
    budget: formData.get("budget"),
    image_url: formData.get("imageUrl"), // 수정
    state: true,
  };
  // console.log(writeData);

  const { files } = document.querySelector("#imageUrl");
  const file = files[0];
  if (file) {
    const timestamp = new Date().getTime();
    const fileName = `post_image_${timestamp}_${file.name}`;
    const filePath = `${folderName}/${fileName}`;

    try {
      const { data: image, error: uploadError } = await supabase.storage
        .from(matebucketName)
        .upload(filePath, file);

      if (uploadError) {
        console.error("이미지 업로드 실패: ", uploadError);
        return;
      } else {
        // console.log(image.path);
        writeData.image_url = image.path;
      }
    } catch (error) {
      console.log("이미지 업로드 중 오류: ", error);
      return;
    }
  }

  const styles = formData.getAll("styles");

  try {
    const { data: postingData, error: postingError } = await _supabase
      .from(mateTable)
      .insert([writeData])
      .select("id") // 작성된 게시글의 posting_id만 선택
      .single(); // 단일 결과 반환하도록 지정

    if (postingError) {
      console.error("게시글 작성 실패:", postingError);
      alert("게시글 작성에 실패했습니다.");
      return;
    }

    const postingId = postingData.id;
    console.log("새 게시글 ID:", postingId);

    // 여행 스타일 연결 테이블
    if (styles.length > 0) {
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
          } else {
            console.log(`게시글-스타일 (${styleName}) 연결 성공`);
          }
        }
      }
    }

    alert("게시글 작성 완료!");
    //     mateForm.reset(); // 폼 초기화 (선택 사항)
    window.location.href = "index.html"; // 게시글 목록 페이지로 리디렉션 (실제 서비스에서는 appropriate URL로 변경)
  } catch (error) {
    console.error("게시글 작성 중 오류:", error);
    alert("게시글 작성 중 오류가 발생했습니다.");
  }
});
