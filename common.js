document.addEventListener("DOMContentLoaded", function () {
  const currentPath = window.location.pathname;
  const assetsPath =
    currentPath.includes("/mateSearch/") || currentPath.includes("/aiPlanner/")
      ? "../assets/"
      : "./assets/";

  const favicons = `
        <link rel="icon" type="image/png" href="${assetsPath}favicon/favicon-96x96.png" sizes="96x96">
        <link rel="icon" type="image/svg+xml" href="${assetsPath}favicon/favicon.svg">
        <link rel="shortcut icon" href="${assetsPath}favicon/favicon.ico">
        <link rel="apple-touch-icon" sizes="180x180" href="${assetsPath}favicon/apple-touch-icon.png">
        <link rel="manifest" href="${assetsPath}favicon/site.webmanifest">
    `;
  document.head.insertAdjacentHTML("beforeend", favicons);

  const footer = `
        <footer class="custom-footer py-5">
            <div class="container">
                <div class="row g-4">
                    <div class="col-lg-6 mb-4 mb-lg-0">
                        <h5 class="text-primary fw-bold mb-3">여행 비서</h5>
                        <p class="text-muted mb-0">
                            당신의 완벽한 여행 동행자를 찾아드립니다<br>
                            새로운 인연과 특별한 추억을 만들어보세요
                        </p>
                    </div>
                    <div class="col-lg-6 col-md-6">
                        <div class="d-flex justify-content-end">
                            <button class="scroll-to-top-circle" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
                                <i class="bi bi-arrow-up text-white"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <hr class="my-4 border-secondary-subtle">
                <div class="row align-items-center">
                    <div class="col-md-6 text-center text-md-start">
                        <p class="text-muted small mb-0">&copy; 2025 Travel Secretary. All rights reserved.</p>
                    </div>
                    <div class="col-md-6 text-center text-md-end mt-3 mt-md-0">
                        <a href="#" class="footer-link me-3">개인정보처리방침</a>
                        <a href="#" class="footer-link">이용약관</a>
                    </div>
                </div>
            </div>
        </footer>
    `;
  document.body.insertAdjacentHTML("beforeend", footer);
});
