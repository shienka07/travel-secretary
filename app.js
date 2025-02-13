import { checkLogin, logout, getProfile, getNickname, getImagePath } from "./js/auth.js"
  const bool = await checkLogin();
  if(bool){
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
        profileLink.className = "d-block link-body-emphasis text-decoration-none dropdown-toggle";
        profileLink.setAttribute("data-bs-toggle", "dropdown");
        profileLink.setAttribute("aria-expanded", "true");

        const profileImg = document.createElement("img");
        
        if(!data.image_url){
          profileImg.src = "https://frqevnyaghrnmtccnerc.supabase.co/storage/v1/object/public/mate-bucket/profile/profile.jpg";
        }

        else{
          profileImg.src = await getImagePath(data.image_url);
        }

        profileImg.alt = "Profile Image";
        profileImg.width = 32;
        profileImg.height = 32;
        profileImg.className = "rounded-circle";

        profileLink.appendChild(profileImg);
        dropdownDiv.appendChild(profileLink);

        const dropdownMenu = document.createElement("ul");
        dropdownMenu.className = "dropdown-menu dropdown-menu-end text-small shadow";

        const menuItems = [
            "user",
            "divider",
            { text: "마이 프로필", href: "#" },
            { text: "작성 글", href: "#" },
            "divider",
            { text: "로그아웃", href: "#" }
        ];

        menuItems.forEach(item => {
            if (item === "divider") {
                const divider = document.createElement("hr");
                divider.className = "dropdown-divider";
                dropdownMenu.appendChild(divider);
            }
            else if(item === "user"){
              const li = document.createElement("li");
                const a = document.createElement("a");
                a.className = "dropdown-item";
                a.href = "#";
                a.textContent = localStorage.getItem("username") + " 님";
                li.appendChild(a);
                dropdownMenu.appendChild(li);
            }
            else {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.className = "dropdown-item";
                a.href = item.href;
                a.textContent = item.text;
                if (item.text == "로그아웃"){
                  a.addEventListener("click", async (event) => {
                    event.preventDefault();
                    await logout();
                    location.reload();
                  })
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
        })

        signupButton.addEventListener("click", () => {
          window.location.href = "./account/register.html";
        })
    }
}

async function load() {
  
  if (bool){
    
    if (!localStorage.getItem("username")){
          const username = await getNickname();
          localStorage.setItem("username", username);
        }

    if (data.gender == null){
      window.location.href = "./account/editprofile.html";
    }


  }
  updateLoginUI(bool);
}

load()