import { _supabase, mateTable, tsTable, ptsTable } from "./config.js";

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

const mateForm = document.querySelector("#mateForm");
mateForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(mateForm);
  const data = {
    user_id: "838dc8ff-5dbb-4318-9a26-4b4b5f667285", // ✅ 임시... 로그인아이디 받아오기
    title: formData.get("title"),
    content: formData.get("content"),
    start_date: formData.get("startDate"),
    end_date: formData.get("endDate"),
    destination: formData.get("destination"),
    is_domestic: formData.get("isDomestic"),
    people: parseInt(formData.get("people")),
    budget: formData.get("budget"),
    image_url: formData.get("imageUrl"),
    state: true,
  };
  console.log(data);

  const styles = formData.getAll("styles");
  console.log(styles);

  //   let imageUrl = null;
  //   if (imageUrlFile) {
  //     const timestamp = new Date().getTime();
  //     const imageName = `post_image_${timestamp}_${imageUrlFile.name}`;

  //     try {
  //       const { data, error: uploadError } = await supabase.storage
  //         .from('travel-mate-post-images') // 스토리지 버킷 이름 (본인 버킷에 맞게 수정)
  //         .upload(imageName, imageUrlFile);

  //       if (uploadError) {
  //         console.error('이미지 업로드 실패:', uploadError);
  //         alert('이미지 업로드에 실패했습니다.');
  //         return; // 이미지 업로드 실패 시 게시글 작성 중단
  //       }

  //       imageUrl = `https://${supabaseUrl.split('://')[1]}/storage/v1/object/public/travel-mate-post-images/${data.path}`; // 이미지 URL 생성 (공개 URL)
  //       console.log('이미지 URL:', imageUrl);

  //     } catch (error) {
  //       console.error('이미지 업로드 중 오류:', error);
  //       alert('이미지 업로드 중 오류가 발생했습니다.');
  //       return;
  //     }
  //   }

  try {
    const { data: postingData, error: postingError } = await _supabase
      .from(mateTable)
      .insert([data])
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
      for (styleName of styles) {
        const { data: styleData, error: styleError } = await _supabase
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
          const { error: postingStyleError } = await _supabase
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
