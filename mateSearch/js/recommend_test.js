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
      }, 나이: ${post.userInfo?.age || "미제공"}세)\n`; // 작성자 정보 (성별, 나이) 추가
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
  prompt += `- 선호 여행지: ${userPrefer.preferredDestination || "무관"}\n`;
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
  prompt += `\n`;

  prompt += `## 분석 요청:\n`;
  prompt += `위 게시글 정보가 제시된 사용자 선호도에 얼마나 잘 부합하는지 분석하고, 다음 기준에 따라 게시글 ID를 추천해주세요.\n`;
  //   prompt += `- **필수적으로 사용자 선호 여행지와 게시글 여행지가 일치해야 합니다.**\n`;
  prompt += `- **선호 연령대, 성별, 예산 범위는** 사용자의 선호 사항이지만, **필수 조건은 아닙니다.**  선호 조건에 얼마나 부합하는지에 따라 추천 점수를 차등적으로 부여하여, 최종적으로 사용자에게 **가장 잘 맞을 것 같은 게시글 ID**를 추천해주세요.\n`;
  prompt += `- 만약 선호 여행지가 일치하지 않는다면, "여행지 불일치" 라고 명확하게 답변해주세요.\n`;
  prompt += `- 답변은 **추천 게시글 ID**만 간결하게 숫자 형태로  표시해주세요.  만약 추천할 게시글 ID가 없다면, "매칭되는 게시글 없음" 이라고 답변해주세요.\n`; // 명확한 답변 형식 지시
  prompt += `\n`;

  prompt += `## 답변:\n`; // LLM 답변 시작 지점 명시
  prompt += `- 추천 게시글 ID: `; // 답변은 게시글 ID 형태로 요청
  prompt += `\n`;
  prompt += `- 추천 이유: `; //

  return prompt;
}

const GEMINI_API_KEY = localStorage.getItem("GEMINI_API_KEY");

const callModel = async (
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

  const userPreferences = {
    preferredDestination: "없음", // 선호 여행지: 이탈리아
    preferredAge: { min: 15, max: 20 }, // 선호 연령대: 15세~20세
    preferredGender: "여성", // 선호 성별: 여성
    preferredBudgetRange: { min: 4000000, max: 6000000 }, // 선호 예산 범위: 400만원~600만원
  };

  console.log();

  const summaryPrompt = createSummaryPrompt(postings);
  console.log("summaryPrompt: ", summaryPrompt);
  const summarized = await callModel(summaryPrompt);
  console.log("summarized", summarized);

  const matchingPrompt = createMatchingPrompt(summarized, userPreferences);
  console.log("matcingPrompt", matchingPrompt);
  const matching = await callModel(
    matchingPrompt,
    "gemini-2.0-flash-thinking-exp-01-21"
  );
  console.log("matching", matching);

  //   const extractedPostId = parsingMatching(matching);

  //   if (extractedPostId) {
  //     console.log("추천 게시글 ID:", extractedPostId);

  //     // window.location.href = `detail.html?id=${extractedPostId}`; // 상세 페이지로 이동 (원하는 동작)
  //   } else {
  //     alert("추천 게시글 ID를 파싱하지 못했습니다.");
  //     console.error("추천 게시글 ID 파싱 실패"); // 에러 로그
  //   }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#testBtn").addEventListener("click", () => {
    exampleMatchingPromptUsage();
  });
});
