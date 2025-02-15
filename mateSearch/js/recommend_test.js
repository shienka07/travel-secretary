import { getProfile } from "../../js/auth.js";
import { supabase, mateTable, ptsTable } from "./config.js";

async function fetchDataFromSupabase() {
  try {
    const { data: postings, error } = await supabase
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
	is_domestic,
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
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Supabase 데이터 로드 실패:", error);
      alert("데이터를 불러오는 데 실패했습니다.");
      return null; // 에러 발생 시 null 반환 또는 에러 처리
    }

    // console.log("Supabase 데이터:", postings); // 가져온 데이터 확인 (디버깅)
    return postings; // 성공적으로 데이터 가져오면 데이터 반환
  } catch (error) {
    console.error("Supabase 데이터 로딩 중 오류:", error);
    alert("데이터를 불러오는 중 오류가 발생했습니다.");
    return null; // 오류 발생 시 null 반환 또는 에러 처리
  }
}

function createSummaryPrompt(postingsData) {
  let context = "";
  if (postingsData && postingsData.length > 0) {
    context += "## 참고 게시글 정보:\n";
    postingsData.forEach((post) => {
      context += `- 게시글 ID ${post.id}:\n`;
      context += `  - 제목: ${post.title}\n`;
      context += `  - 내용: ${post.content}\n`;
      context += `  - 여행지: ${post.destination}\n`;
      context += `  - 기간: ${post.start_date} ~ ${post.end_date}\n`; // 기간 정보 추가
      context += `  - 모집 인원: ${post.people}명\n`; // 모집 인원 추가
      context += `  - 예산: ${post.budget ? post.budget + "원" : "미정"}\n`; // 예산 정보 추가
      context += `  - 국내/국외: ${post.is_domestic ? "국내" : "국외"}\n`; // 국내/국외 정보 추가
      context += `  - 스타일: ${
        post.styles
          .map((style) => "#" + style.style_id.style_name)
          .join(", ") || "없음"
      }\n`; // 스타일 정보 추가
      context += `  - 작성자: ${post.userInfo?.username || "익명"} (성별: ${
        post.userInfo?.gender === 1
          ? "남성"
          : post.userInfo?.gender === 2
          ? "여성"
          : "미제공"
      }, 나이: ${post.userInfo?.age || "미제공"}세, 유저 성향 :  ${post.userinfo?.answer || "미제공"})\n`; // 작성자 정보 (성별, 나이) 추가
      context += `  - 모집 상태: ${post.state ? "모집중" : "모집 완료"}\n`; // 모집 상태 정보 추가
      context += `\n`;
    });
  } else {
    context += "## 참고할 게시글 정보가 없습니다.\n";
  }

  const prompt = `
				${context}
				## 답변:
				(아래 참고 게시글 ID별로 요약해주세요)
				`;

  let answerFormat = "";
  if (postingsData && postingsData.length > 0) {
    answerFormat += "\n## 답변:\n";
    postingsData.forEach((post) => {
      answerFormat += `- 게시글 ID ${post.id} 요약:\n`;
      answerFormat += `  - \n`;
    });
  }

  return prompt + answerFormat;
}

function createMatchingPrompt(data, userPrefer) {
  let prompt = `다음 사용자 선호도에 잘 맞는지 분석해주세요.\n\n`;
  
  prompt += `${data}와 `;

  prompt += `### 사용자 선호도:\n`;
  prompt += `- 사용자의 성향 : ${userPrefer.profilecharacter}\n`;

  const preferredPlace = userPrefer.preferredDestination || userPrefer.preferredlocationType || "무관";

  prompt += `- 선호 여행지: ${preferredPlace}\n`;

  prompt += `- 선호 연령대: ${
    userPrefer.preferredAgeRange
      ? `${userPrefer.preferredAgeRange.min}세 ~ ${userPrefer.preferredAgeRange.max}세`
      : "무관"
  }\n`;
  prompt += `- 선호 성별: ${userPrefer.preferredGender || "무관"}\n`;
  prompt += `- 선호 예산 범위: ${
    userPrefer.preferredBudgetRange
      ? `${userPrefer.preferredBudgetRange.min}원 ~ ${userPrefer.preferredBudgetRange.max}원`
      : "무관"
  }\n`;
  prompt += `- 현재 선호하는 여행 스타일 : ${userPrefer.prefferedstyles || "무관"}\n`;
  prompt += `\n`;

  prompt += `## 분석 요청:\n`;
  prompt += `위 게시글 정보가 제시된 사용자 선호도에 얼마나 잘 부합하는지 분석하고, 다음 기준에 따라 게시글 ID를 추천해주세요.\n`;
  //   prompt += `- **필수적으로 사용자 선호 여행지와 게시글 여행지가 일치해야 합니다.**\n`;
  prompt += `- **선호 연령대, 성별, 예산 범위는** 사용자의 선호 사항이지만, **필수 조건은 아닙니다.**  선호 조건에 얼마나 부합하는지에 따라 최고 점수 70점을 기준으로 추천 점수를 부여하고\n`;
  prompt += `- **게시물과 사용자의 성향이 주어지면 **필수 조건은 아닙니다.** 두 성향이 얼마나 부합하는지에 따라 최고 점수 30점을 기준으로 추천 점수를 추가로 부여하여\n`;
  prompt += `- 최대 추천 점수가 100점인 경우에 추천 점수 70점 이상을 내림차 순으로 정렬해 알려주세요..\n`; //일정 수치를 넘어가면 
  prompt += `- 답변은 **추천 게시글 ID**만 간결하게 숫자 형태로  표시해주세요.  만약 추천할 게시글 ID가 없다면, 0 이라고 답변해주세요.\n`; // 명확한 답변 형식 지시
  prompt += `\n`;

  prompt += `## 질문에 대해 다음과 같은 JSON 형식 반드시 score, answer, ID 3가지 모두 String으로 응답하세요\n {"score" : "모든 ID 추천 점수", "answer" : "추천내용" , "ID" : "추천 ID"}`; // LLM 답변 시작 지점 명시 sweetalert spinner


  return prompt;
}

const GEMINI_API_KEY = localStorage.getItem("GEMINI_API_KEY")

const callModel = async (
  prompt,
  modelName = "gemini-2.0-flash-thinking-exp-01-21", // gemini-2.0-flash-thinking-exp-01-21,  gemini-2.0-pro-exp-02-05
  action = "generateContent",
  generationConfig = {}
  // autoSearch = true
) => {
  // 현재 모델명으로 URL 생성 (모델명 변경 시 최신 URL 사용)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${action}?key=${GEMINI_API_KEY}`;
  console.log("처리 시작", new Date(), "모델:", modelName);
  try {
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("오류 발생:", error);
  } finally {
    console.log("처리 종료", new Date());
  }
};

const callModel2 = async (
  prompt,
  modelName = "gemini-2.0-pro-exp-02-05",
  action = "generateContent",
  generationConfig = {}
  // autoSearch = true
) => {
  // 현재 모델명으로 URL 생성 (모델명 변경 시 최신 URL 사용)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${action}?key=${GEMINI_API_KEY}`;
  console.log("처리 시작", new Date(), "모델:", modelName);
  try {
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error("오류 발생:", error);
  } finally {
    console.log("처리 종료", new Date());
  }
};



async function exampleMatchingPromptUsage() {
  const postings = await fetchDataFromSupabase();
  console.log("postings: ", postings);

  const locationTypeFilter = document.querySelector(
    'input[name="locationTypeFilter"]:checked'
  ).value;
  let location = "";
  if(locationTypeFilter == "domestic"){
    location = "국내"
  }
  else if(locationTypeFilter == "international"){
    location = "국외"
  }
  const destinationFilter = document.querySelector("#destinationFilter").value;
  const minAgeFilter = document.querySelector("#ageFilterMin").value;
  const maxAgeFilter = document.querySelector("#ageFilterMax").value;
  const genderFilter = document.querySelector(
    'input[name="genderFilter"]:checked'
  ).value;
  const dateFilter = document.querySelector("#dateFilter").value;
  const styleFilters = Array.from(
    document.querySelectorAll('#styleFilters input[type="checkbox"]:checked')
  ).map((checkbox) => checkbox.value);

  // ✅ 예산 추가
  let gender = genderFilter == 1 ? "남성" : (genderFilter == 2 ? "여성" : "전체");
  const filters = {
    locationType: location,
    destination: destinationFilter,
    minAge: minAgeFilter,
    maxAge: maxAgeFilter,
    gender: gender,
    date: dateFilter,
    styles: styleFilters,
  };

  const data = await getProfile();

  const userPreferences = {
    preferredlocationType : filters.locationType,
    preferredDestination: filters.destination,
    preferredAgeRange: { min: filters.minAge, max : filters.maxAge },
    preferredGender: filters.gender,
    prefferedstyles : filters.styles,
    profilecharacter : data.answer,
    //preferredBudgetRange: { min: 200000, max: 4000000 }, // 추후 추가
  };

  console.log(userPreferences);

  const summaryPrompt = createSummaryPrompt(postings);
  console.log("summaryPrompt: ", summaryPrompt);
  const summarized = await callModel(summaryPrompt);
  console.log("summarized", summarized);

  const matchingPrompt = createMatchingPrompt(summarized, userPreferences);
  console.log("matcingPrompt", matchingPrompt);
  const matching = await callModel2(
    matchingPrompt,
    "gemini-2.0-flash-thinking-exp-01-21"
  );

  const regex = /{([^}]*)}/;

  const match = matching.match(regex);
  console.log(match[0]);
  const parsedData = JSON.parse(match[0]);
  console.log(parsedData.ID)
  const postArray = parsedData.ID.split(",").map(item => item.trim());
  if(postArray[0] == 0){
    const error = new Error("매칭실패");
    error.name = "MatchingError"; // 명시적으로 name 설정
    throw error;
  }

  const postIdsString = postArray.join(',');
  const baseUrl = "./index.html"; // 게시물 목록 페이지 기본 URL (실제 URL에 맞게 수정)
  const urlWithParams = `${baseUrl}?postIds=${postIdsString}`;
  history.pushState({}, '', urlWithParams);

  displayRecommendPost(postArray)
}

async function displayRecommendPost(postArray) {
  const { data: postings, error } = await supabase
    .from(mateTable)
    .select(`
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
  is_domestic,
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
  `)
    .in("id", postArray);

  const sortedPostings = postArray.map(id =>
    postings.find(post => Number(post.id) === Number(id))
  );

  const box = document.querySelector("#box");
  box.innerHTML = ""; // 기존 목록 비우기
  console.log("displayPostings 호출, 표시할 게시글 수:", postings.length);

  if (postings && postings.length > 0) {
      postings.forEach((posting) => {
        // Bootstrap 카드 컬럼 (md 사이즈 이상에서 3개씩 배치)
        const colDiv = document.createElement("div");
        colDiv.classList.add("col-md-4", "mb-4"); // col-md-4 클래스로 3개씩 배치, mb-4는 간격
  
        const card = document.createElement("div");
        card.classList.add("card");
        colDiv.appendChild(card); // 컬럼 안에 카드 배치
  
        const imgArea = document.createElement("div");
        imgArea.classList.add("position-relative");
        card.appendChild(imgArea);
  
        const { data: imageUrlData } = supabase.storage
          .from("mate-bucket")
          .getPublicUrl(posting.image_url);
        const imageElement = document.createElement("img");
        imageElement.src = imageUrlData.publicUrl;
        imageElement.classList.add("card-img-top", "object-fit-cover");
        imageElement.style = "height: 225px";
        imageElement.alt = "게시글 이미지";
  
        // 커서 스타일 추가
        imageElement.style.cursor = "pointer";
  
        // 클릭 이벤트 추가
        imageElement.addEventListener("click", () => {
          window.location.href = `./detail.html?id=${posting.id}`;
        });
        imgArea.appendChild(imageElement);
  
        // const cardBody = document.createElement("div");
        // cardBody.classList.add("card-body");
        // card.appendChild(cardBody);
  
        // const infoArea = document.createElement("div");
        // // infoArea.classList.add("info-area", "p-3");
        // infoArea.classList.add("card-text");
        // cardBody.appendChild(infoArea);
  
        // const authorInfoElement = document.createElement("p");
        // const genderText =
        //   posting.userInfo?.gender === 1
        //     ? "남성"
        //     : posting.userInfo?.gender === 2
        //     ? "여성"
        //     : "미제공"; // 삼항 연산자
        // authorInfoElement.innerHTML = `${genderText}  | 나이: ${
        //   posting.userInfo?.age || "미제공"
        // }`;
        // infoArea.appendChild(authorInfoElement);
  
        // const destinationElement = document.createElement("p");
        // destinationElement.textContent = `여행지: ${posting.destination}`;
        // infoArea.appendChild(destinationElement);
  
        // const peopleElement = document.createElement("p");
        // peopleElement.textContent = `모집인원수: ${posting.people} 명`;
        // infoArea.appendChild(peopleElement);
  
        // const budgetElement = document.createElement("p");
        // const formattedBudget = posting.budget
        //   ? parseInt(posting.budget).toLocaleString()
        //   : "미정"; // 숫자로 변환 후 포맷팅, 아니면 '미정'
        // budgetElement.textContent = `예산: ${formattedBudget}`; // '원' 또는 통화 단위 추가 가능
        // infoArea.appendChild(budgetElement);
  
        // const dateElement = document.createElement("p");
        // dateElement.textContent = `기간: ${posting.start_date} ~ ${posting.end_date}`;
        // infoArea.appendChild(dateElement);
  
        const cardFooter = document.createElement("div");
        cardFooter.classList.add("card-footer", "p-3");
        card.appendChild(cardFooter);
  
        const titleLink = document.createElement("a");
        titleLink.href = `./detail.html?id=${posting.id}`;
        titleLink.classList.add("card-title-link");
        titleLink.style.textDecoration = "none";
  
        const statusText = posting.state ? "모집중" : "모집 완료";
        // const isDomesticText = posting.is_domestic ? "국내" : "해외";
        const destinationText = posting.destination;
  
        const titleFullElement = document.createElement("h6");
        titleFullElement.classList.add("mb-2");
        titleFullElement.style.fontWeight = 700;
        titleFullElement.textContent = `[${statusText}] ${destinationText}`;
  
        const MAX_LENGTH = 15;
        const titleElement = document.createElement("p");
        titleElement.style.fontWeight = 300;
        titleElement.textContent =
          posting.title.length > MAX_LENGTH
            ? posting.title.substring(0, MAX_LENGTH) + "..."
            : posting.title;
        // titleElement.textContent = posting.title;
        // titleFullElement.appendChild(titleElement);
        titleLink.appendChild(titleFullElement);
        titleLink.appendChild(titleElement);
        cardFooter.appendChild(titleLink);
  
        // const contentElement = document.createElement("p");
        // contentElement.classList.add("card-text");
        // contentElement.textContent = posting.content;
        // cardFooter.appendChild(contentElement);
  
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

//   const extractedPostId = parsingMatching(matching);

//   if (extractedPostId) {
//     console.log("추천 게시글 ID:", extractedPostId);

//     // window.location.href = `detail.html?id=${extractedPostId}`; // 상세 페이지로 이동 (원하는 동작)
//   } else {
//     alert("추천 게시글 ID를 파싱하지 못했습니다.");
//     console.error("추천 게시글 ID 파싱 실패"); // 에러 로그
//   }

let timerInterval;

async function triggerSwal() {
    Swal.fire({
      title: "AI 자동 매칭 진행 중입니다.",
      html: "매칭 이후 자동으로 닫힙니다... <b></b>",
      timer: 40000,
      timerProgressBar: true,
      allowOutsideClick: false, // ← 추가된 옵션
      allowEscapeKey: false,    // ESC 키 방지 (선택사항)
      didOpen: async () => { // ✅ didOpen에서 비동기 작업 시작
        Swal.showLoading();
        const timer = Swal.getPopup().querySelector("b");
  
        // 비동기 작업 실행
        try {
          await exampleMatchingPromptUsage();
          Swal.close(); // 작업 완료 시 수동 종료
        } catch (error) {
          if(error.name == "MatchingError"){
            Swal.fire({
              icon: "error",
              title: "매칭 실패",
              text: "조건에 맞는 여행 메이트를 찾지 못했습니다.",
            });
          }
          else{
            Swal.fire("오류 발생!", error.message, "error");
          }
        }
      },
      willClose: () => {
        clearInterval(timerInterval);
      }
    });
  }


document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postIdsParam = urlParams.get('postIds'); // URL에서 "postIds" 파라미터 값 가져오기

  let postArrayFromUrl = [];
  if (postIdsParam) {
      postArrayFromUrl = postIdsParam.split(',').map(item => item.trim()); // 콤마로 분리하고 공백 제거
      // 필요하다면 각 ID를 숫자로 변환 (원래 코드를 참고하여 Number()로 감싸기)
      // postArrayFromUrl = postIdsParam.split(',').map(item => Number(item.trim()));
  }

  console.log(postArrayFromUrl); // 예: ["123", "456", "789"] 또는 [123, 456, 789] (숫자 변환했을 경우)

  // displayRecommendPost 함수 호출 시 postArrayFromUrl 사용
  displayRecommendPost(postArrayFromUrl);
  document.querySelector("#testBtn").addEventListener("click", () => {
    triggerSwal();
    
  });
});
