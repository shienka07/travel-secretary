import { supabase, tsTable } from "../supabase.js";

// 여행 스타일 목록 불러오기
export async function fetchTravelStylesAndDisplayCheckboxes(id) {
  const styleContainer = document.querySelector(`#${id}`);
  try {
    const { data: travelStyles, error } = await supabase
      .from(tsTable) // config.js에서 import한 테이블 이름 사용
      .select("*") // 모든 컬럼 (*) 선택
      .order("style_id", { ascending: true });
    if (error) {
      console.error("여행 스타일 데이터 로드 실패:", error);
      alert("여행 스타일을 불러오는 데 실패했습니다.");
      return; // 함수 종료
    }

    if (travelStyles && travelStyles.length > 0) {
      // 가져온 여행 스타일 데이터가 있는 경우
      travelStyles.forEach((style) => {
        const checkboxDiv = document.createElement("div");
        checkboxDiv.classList.add("form-check", "form-check-inline");

        const checkboxInput = document.createElement("input");
        checkboxInput.classList.add("form-check-input");
        checkboxInput.type = "checkbox";
        checkboxInput.name = "styles";
        checkboxInput.value = style.style_name;
        checkboxInput.id = `style${style.style_name}`;

        const checkboxLabel = document.createElement("label");
        checkboxLabel.classList.add("form-check-label");
        checkboxLabel.htmlFor = `style${style.style_name}`;
        checkboxLabel.textContent = `${style.style_name}`;

        checkboxDiv.appendChild(checkboxInput);
        checkboxDiv.appendChild(checkboxLabel);
        styleContainer.appendChild(checkboxDiv); // 컨테이너에 div (체크박스 + label) 추가
      });
    } else {
      // 여행 스타일 데이터가 없는 경우 (예: 테이블이 비어있음)
      styleFilters.textContent = "여행 스타일이 없습니다."; // 또는 다른 메시지 표시
    }
  } catch (error) {
    console.error("여행 스타일 데이터 로딩 중 오류:", error);
    alert("여행 스타일을 불러오는 중 오류가 발생했습니다.");
  }
}
