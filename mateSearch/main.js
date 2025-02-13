import { _supabase, mateTable, tsTable, ptsTable } from "./config.js";

async function fetchMatePostingsWithStyles() {
  try {
    const { data: postings, error } = await _supabase
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
				content,
				created_at,
				image_url,
				state,
				budget,
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
      .order("created_at", { ascending: false }); // 최신글 먼저

    if (error) {
      console.error("게시글 목록 및 스타일 조회 실패:", error);
      alert("게시글 목록을 불러오는 데 실패했습니다.");
      return;
    }

    console.log("게시글 목록 (스타일 포함):", postings); // 콘솔에 결과 확인

    displayPostings(postings); // 게시글 목록 화면에 표시하는 함수 호출
  } catch (error) {
    console.error("게시글 목록 및 스타일 조회 중 오류:", error);
    alert("게시글 목록을 불러오는 중 오류가 발생했습니다.");
  }
}
function displayPostings(postings) {
  const box = document.querySelector("#box");
  box.innerHTML = ""; // 기존 목록 비우기

  if (postings && postings.length > 0) {
    postings.forEach((posting) => {
      // Bootstrap 카드 컬럼 (md 사이즈 이상에서 3개씩 배치)
      const colDiv = document.createElement("div");
      colDiv.classList.add("col-md-4", "mb-4"); // col-md-4 클래스로 3개씩 배치, mb-4는 간격

      const card = document.createElement("div");
      card.classList.add("card");
      colDiv.appendChild(card); // 컬럼 안에 카드 배치

      const cardBody = document.createElement("div");
      cardBody.classList.add("card-body");
      card.appendChild(cardBody);

      const row = document.createElement("div");
      row.classList.add("row", "g-0");
      cardBody.appendChild(row);

      const imageCol = document.createElement("div");
      imageCol.classList.add("col-md-4");
      row.appendChild(imageCol);

      const imageArea = document.createElement("div");
      imageArea.classList.add("image-area", "p-3");
      imageCol.appendChild(imageArea);

      // ✅ 이미지 넣어서 확인해볼것!!!
      if (posting.image_url) {
        const imageElement = document.createElement("img");
        imageElement.src = posting.image_url;
        imageElement.alt = "게시글 이미지";
        imageElement.classList.add("img-fluid", "rounded");
        imageArea.appendChild(imageElement);
      } else {
        imageArea.innerHTML = '<div class="image-placeholder rounded"></div>';
        const placeholder = imageArea.querySelector(".image-placeholder");
        placeholder.classList.add(
          "bg-light",
          "d-flex",
          "justify-content-center",
          "align-items-center",
          "p-4"
        );
        placeholder.style.height = "150px";
        placeholder.textContent = "No Image";
      }

      const infoCol = document.createElement("div");
      infoCol.classList.add("col-md-8");
      row.appendChild(infoCol);

      const infoArea = document.createElement("div");
      infoArea.classList.add("info-area", "p-3");
      infoCol.appendChild(infoArea);

      const authorInfoElement = document.createElement("p");
      const genderText =
        posting.userInfo?.gender === 1
          ? "남성"
          : posting.userInfo?.gender === 2
          ? "여성"
          : "미제공"; // 삼항 연산자
      authorInfoElement.innerHTML = `성별: ${genderText}  | 나이: ${
        posting.userInfo?.age || "미제공"
      }`;
      infoArea.appendChild(authorInfoElement);

      const destinationElement = document.createElement("p");
      destinationElement.textContent = `여행지: ${posting.destination}`;
      infoArea.appendChild(destinationElement);

      const peopleElement = document.createElement("p");
      peopleElement.textContent = `모집인원수: ${posting.people} 명`;
      infoArea.appendChild(peopleElement);

      const budgetElement = document.createElement("p");
      const formattedBudget = posting.budget
        ? parseInt(posting.budget).toLocaleString()
        : "미정"; // 숫자로 변환 후 포맷팅, 아니면 '미정'
      budgetElement.textContent = `예산: ${formattedBudget}`; // '원' 또는 통화 단위 추가 가능
      infoArea.appendChild(budgetElement);

      const dateElement = document.createElement("p");
      dateElement.textContent = `기간: ${posting.start_date} ~ ${posting.end_date}`;
      infoArea.appendChild(dateElement);

      const cardFooter = document.createElement("div");
      cardFooter.classList.add("card-footer", "p-3");
      card.appendChild(cardFooter);
      // ✅ 경로 확인 필요
      const titleLink = document.createElement("a");
      titleLink.href = `/travel-secretary/mateSearch/detail.html?id=${posting.id}`;
      titleLink.classList.add("card-title-link");
      titleLink.style.textDecoration = "none";

      const statusText = posting.state ? "[모집중]" : "[모집 완료]";
      console.log("state", posting.state);
      const titleFullElement = document.createElement("h5");
      titleFullElement.classList.add("card-title", "mb-2");
      titleFullElement.textContent = `${statusText} `;

      const titleElement = document.createElement("span");
      titleElement.textContent = posting.title;
      titleFullElement.appendChild(titleElement);
      titleLink.appendChild(titleFullElement);
      cardFooter.appendChild(titleLink);

      const contentElement = document.createElement("p");
      contentElement.classList.add("card-text");
      contentElement.textContent = posting.content;
      cardFooter.appendChild(contentElement);

      const stylesElement = document.createElement("div");
      stylesElement.classList.add("styles-tags", "mt-3");
      if (posting.styles && posting.styles.length > 0) {
        posting.styles.forEach((style) => {
          const styleTag = document.createElement("span");
          styleTag.classList.add("badge", "bg-secondary", "me-1", "mb-1");
          styleTag.textContent = `#${style.style_id.style_name}`;
          stylesElement.appendChild(styleTag);
        });
      }
      cardFooter.appendChild(stylesElement);

      box.appendChild(colDiv); // box에 컬럼(colDiv) 추가 (기존 card 대신)
    });
  } else {
    box.textContent = "등록된 게시글이 없습니다.";
  }
}

// 페이지 로드 시 게시글 목록 불러오기
document.addEventListener("DOMContentLoaded", () => {
  fetchMatePostingsWithStyles(); // 게시글 목록 및 스타일 정보 가져오는 함수 호출
});
