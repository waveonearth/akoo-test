// 다크모드 토글
const darkToggle = document.getElementById('darkmode-switch');
darkToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark', darkToggle.checked);
    localStorage.setItem('darkMode', darkToggle.checked ? 'on' : 'off');
});

// 페이지 로드시 다크모드 상태 복원
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'on') {
        document.body.classList.add('dark');
        darkToggle.checked = true;
    }
});

// 아코디언 메뉴
document.querySelectorAll('.toggle-header').forEach(header => {
    header.addEventListener('click', () => {
        const submenu = header.nextElementSibling;
        submenu.classList.toggle('open');
    });
});

// pagination 아코디언에 맞춰서
function repositionPagination() {
    const main = document.querySelector('.main');
    const pagination = document.querySelector('.pagination-container');

    if (main && pagination) {
        const mainBottom = main.getBoundingClientRect().bottom + window.scrollY;
        pagination.style.top = `${mainBottom}px`;
    }
}

function observeMainChanges() {
    const main = document.querySelector('.main');
    if (!main) return;

    const observer = new MutationObserver(() => {
        repositionPagination();
    });

    observer.observe(main, { childList: true, subtree: true });

    // Fallback: 렌더 완료 후에도 강제로 한 번 더
    setTimeout(repositionPagination, 500);
}

// 초기 실행
window.addEventListener('DOMContentLoaded', () => {
    repositionPagination();
    observeMainChanges();
});

window.addEventListener('resize', repositionPagination);
window.addEventListener('click', () => setTimeout(repositionPagination, 100));

// 스크롤 탑 버튼
const scrollTopBtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', () => {
    scrollTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
});
scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

menuToggle.addEventListener('click', () => {
    mobileMenu.style.display = (mobileMenu.style.display === 'flex') ? 'none' : 'flex';
});