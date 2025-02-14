import {
  checkLogin,
  logout,
  getProfile,
  getNickname,
  getImagePath,
  fetchLatestPosts_auth,
} from "./js/auth.js";
import { supabase } from "./js/supabase.js";

// 전역 스코프에서 바로 실행되는 즉시 실행 함수
(async function initialize() {
  try {
    const posts = await fetchLatestPosts_auth();
    updateMainPage(posts);
  } catch (error) {
    console.error("초기화 중 에러 발생:", error);
  }
})();

const bool = await checkLogin();
if (bool) {
  var data = await getProfile();
}
async function updateLoginUI(isLoggedIn) {
  const afterLoginDiv = document.getElementById("afterlogin");
  afterLoginDiv.replaceChildren(); // 기존 요소 초기화

  if (isLoggedIn) {
    const dropdownDiv = document.createElement("div");
    dropdownDiv.className = "flex-shrink-0 dropdown";

    const profileLink = document.createElement("a");
    profileLink.href = "#";
    profileLink.className =
      "d-block link-body-emphasis text-decoration-none dropdown-toggle";
    profileLink.setAttribute("data-bs-toggle", "dropdown");
    profileLink.setAttribute("aria-expanded", "true");

    const profileImg = document.createElement("img");

    if (!data.image_url) {
      profileImg.src =
        "https://frqevnyaghrnmtccnerc.supabase.co/storage/v1/object/public/mate-bucket/profile/profile.jpg";
    } else {
      profileImg.src = await getImagePath(data.image_url);
    }

    profileImg.alt = "Profile Image";
    profileImg.width = 32;
    profileImg.height = 32;
    profileImg.className = "rounded-circle";

    profileLink.appendChild(profileImg);
    dropdownDiv.appendChild(profileLink);

    const dropdownMenu = document.createElement("ul");
    dropdownMenu.className =
      "dropdown-menu dropdown-menu-end text-small shadow";

    const menuItems = [
      "user",
      "divider",
      { text: "마이 프로필", href: "./account/myprofile.html" },
      { text: "작성 글", href: "#" },
      "divider",
      { text: "로그아웃", href: "#" },
    ];

    menuItems.forEach((item) => {
      if (item === "divider") {
        const divider = document.createElement("hr");
        divider.className = "dropdown-divider";
        dropdownMenu.appendChild(divider);
      } else if (item === "user") {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "dropdown-item";
        a.href = "#";
        a.textContent = localStorage.getItem("username") + " 님";
        li.appendChild(a);
        dropdownMenu.appendChild(li);
      } else {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "dropdown-item";
        a.href = item.href;
        a.textContent = item.text;
        if (item.text == "로그아웃") {
          a.addEventListener("click", async (event) => {
            event.preventDefault();
            await logout();
            location.reload();
          });
        }
        li.appendChild(a);
        dropdownMenu.appendChild(li);
      }
    });

    dropdownDiv.appendChild(dropdownMenu);
    afterLoginDiv.appendChild(dropdownDiv);
  } else {
    const loginButton = document.createElement("button");
    loginButton.type = "button";
    loginButton.className = "btn btn-outline-primary me-2";
    loginButton.textContent = "로그인";

    const signupButton = document.createElement("button");
    signupButton.type = "button";
    signupButton.className = "btn btn-primary";
    signupButton.textContent = "회원가입";

    afterLoginDiv.appendChild(loginButton);
    afterLoginDiv.appendChild(signupButton);

    loginButton.addEventListener("click", () => {
      window.location.href = "./account/login.html";
    });

    signupButton.addEventListener("click", () => {
      window.location.href = "./account/register.html";
    });
  }
}

function updateMainPage(posts) {
  const postContainer = document.querySelector(
    ".row.row-cols-1.row-cols-sm-2.row-cols-md-3.g-3"
  );

  if (!postContainer) {
    console.error("게시글 컨테이너를 찾을 수 없습니다!");
    return;
  }

  postContainer.innerHTML = posts
    .map((post) => {
      // 이미지 URL 처리
      let imageUrl;
      if (post.image_url) {
        // Supabase Storage public URL 생성
        imageUrl = ""; // TODO
      } else {
        // 다른 플레이스홀더 이미지 사용
        imageUrl = "https://placehold.co/225x225";
      }

      return `
      <div class="col">
        <div class="card shadow-sm">
          <img src="${imageUrl}" 
               class="bd-placeholder-img card-img-top" 
               width="100%" 
               height="225" 
               alt="게시글 이미지"
               onerror="this.src='https://placehold.co/225x225'">
          <div class="card-body">
            <h5 class="card-title">${post.title || "제목 없음"}</h5>
            <p class="card-text">${
              post.content ? post.content.substring(0, 50) + "..." : "내용 없음"
            }</p>
            <div class="d-flex justify-content-between align-items-center">
              <div class="btn-group">
                <a href="detail.html?id=${
                  post.id
                }" class="btn btn-sm btn-outline-secondary">View</a>
              </div>
              <small class="text-body-secondary">${new Date(
                post.created_at
              ).toLocaleDateString()}</small>
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  console.log("✅ 6. 게시글 표시 완료");
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("🔵 DOMContentLoaded 이벤트 발생");
  fetchAndDisplayPosts();
});

const postContainer = document.querySelector(".album .container .row");

async function load() {
  if (bool) {
    if (!localStorage.getItem("username")) {
      localStorage.setItem("username", data.username);
      localStorage.setItem("profile_img", data.image_url);
    }

    if (data.gender == null) {
      window.location.href = "./account/editprofile.html";
    }
  }
  updateLoginUI(bool);
}

load();
