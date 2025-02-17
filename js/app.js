import {
  checkLogin,
  logout,
  getProfile,
  getImagePath,
  fetchLatestPosts_auth,
} from "./auth.js";

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
      { text: "마이 프로필", href: "./html/account/myprofile.html" },
      { text: "AI 캐릭터 생성", href: "./html/account/characterai.html" },
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
            Swal.fire({
              position: "center",
              icon: "success",
              title: "로그아웃!\n메인 페이지로 이동합니다.",
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              window.location.reload();
            });
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
      window.location.href = "./html/account/login.html";
    });

    signupButton.addEventListener("click", () => {
      window.location.href = "./html/account/register.html";
    });
  }
}

async function updateMainPage(posts) {
  const postContainer = document.querySelector(
    ".row.row-cols-1.row-cols-sm-2.row-cols-md-3.g-3"
  );

  if (!postContainer) {
    console.error("게시글 컨테이너를 찾을 수 없습니다!");
    return;
  }

  // 게시물을 3개씩 그룹화
  const groupedPosts = [];
  for (let i = 0; i < posts.length; i += 3) {
    groupedPosts.push(posts.slice(i, i + 3));
  }

  // 모든 이미지 URL을 미리 처리
  const processedPosts = await Promise.all(
    posts.map(async (post) => ({
      ...post,
      processedImageUrl: post.image_url
        ? await getImagePath(post.image_url)
        : "https://placehold.co/225x225",
    }))
  );

  // 처리된 게시물을 다시 그룹화
  const processedGroupedPosts = [];
  for (let i = 0; i < processedPosts.length; i += 3) {
    processedGroupedPosts.push(processedPosts.slice(i, i + 3));
  }

  postContainer.innerHTML = `
    <div id="postCarousel" class="carousel slide w-100" data-bs-ride="carousel" data-bs-interval="5000">
      <div class="carousel-inner">
        ${processedGroupedPosts
          .map(
            (group, index) => `
          <div class="carousel-item ${index === 0 ? "active" : ""}">
            <div class="row g-4 justify-content-center"> <!-- justify-content-center 추가 -->
              ${group
                .map(
                  (post) => `
                <div class="col-md-4" style="max-width: 400px;"> 
                  <div class="card h-100 shadow-sm border-0">
                    <div class="position-relative">
                      <img src="${post.processedImageUrl}" 
                           class="card-img-top object-fit-cover"
                           style="height: 225px;"
                           alt="게시글 이미지"
                           onerror="this.src='./default.jpg'">
                    </div>
                    <div class="card-body d-flex flex-column">
                      <h5 class="card-title fw-bold mb-3">${
                        post.title || "제목 없음"
                      }</h5>
                      <p class="card-text flex-grow-1 mb-3">${
                        post.content
                          ? post.content.substring(0, 50) + "..."
                          : "내용 없음"
                      }</p>
                      <div class="d-flex justify-content-between align-items-center">
                        <a href="./html/mateSearch/detail.html?id=${
                          post.id
                        }" class="btn btn-outline-secondary btn-sm px-3">View</a>
                        <small class="text-muted">${new Date(
                          post.created_at
                        ).toLocaleDateString()}</small>
                      </div>
                    </div>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
          )
          .join("")}
      </div>
      <button class="carousel-control-prev" type="button" data-bs-target="#postCarousel" data-bs-slide="prev" style="width: 5%">
        <span class="carousel-control-prev-icon bg-dark bg-opacity-25 rounded p-3" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#postCarousel" data-bs-slide="next" style="width: 5%">
        <span class="carousel-control-next-icon bg-dark bg-opacity-25 rounded p-3" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>
  `;
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
      //localStorage.setItem("profile_img", data.image_url);
    }

    if (data.gender == null) {
      window.location.href = "./html/account/editprofile.html";
    }
  }
  updateLoginUI(bool);
}

load();
