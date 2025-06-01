import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    where
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD5AN9oWoPZ7AHOpTL7YTfCWk3qRiRB_qo",
    authDomain: "akoo-test.firebaseapp.com",
    projectId: "akoo-test",
    storageBucket: "akoo-test.firebasestorage.app",
    messagingSenderId: "563210121212",
    appId: "1:563210121212:web:5c59af2f94c3b6e11c8c79",
    measurementId: "G-17EQML779Y"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const POSTS_PER_PAGE = 10;
const BASE_POST_NUM = 169620;
const category = new URLSearchParams(window.location.search).get("board");
const path = window.location.pathname;
const isIndex = path.includes("index.html") || path === "/" || path === "";
const tbody = document.querySelector(".post-tbody");
const paginationContainer = document.querySelector(".pagination");
const initialDummyCount = document.querySelectorAll("tbody .dummy").length;

let allPosts = [];
let currentPage = 1;

const categoryMap = {
    huntertalk: "헌터토크",
    kpop: "케이팝",
    kdrama: "한국드라마",
    square: "스퀘어",
    daily: "일상토크",
    bl: "BL",
    drama: "해외드라마",
    hot: "HOT",
    kfamous: "국내유명인",
    famous: "해외유명인"
};

function formatVirtualTime(timestamp) {
    const realNow = new Date();
    const virtualNow = new Date(realNow);
    virtualNow.setFullYear(virtualNow.getFullYear() - 8);
    virtualNow.setMonth(virtualNow.getMonth() - 5);

    const postTime = new Date(timestamp);
    const virtualPostTime = new Date(postTime);
    virtualPostTime.setFullYear(virtualPostTime.getFullYear() - 8);
    virtualPostTime.setMonth(virtualPostTime.getMonth() - 5);

    const diff = virtualNow - virtualPostTime;
    const diffHr = Math.floor(diff / (1000 * 60 * 60));

    if (diffHr < 24) {
        // hh:mm 포맷
        return `${String(virtualPostTime.getHours()).padStart(2, '0')}:${String(virtualPostTime.getMinutes()).padStart(2, '0')}`;
    }

    return `${String(virtualPostTime.getMonth() + 1).padStart(2, '0')}/${String(virtualPostTime.getDate()).padStart(2, '0')}`;
}

let paginatedPages = [];

function buildPaginatedPages() {
    paginatedPages = [];

    const real = [...realPosts];
    const dummy = [...dummyPosts];

    let realIndex = 0;
    let dummyIndex = 0;

    while (true) {
        const page = [];

        // 실 먼저 채움
        while (page.length < POSTS_PER_PAGE && realIndex < real.length) {
            page.push(real[realIndex++]);
        }

        // 부족하면 더미로 채움
        while (page.length < POSTS_PER_PAGE && dummyIndex < dummy.length) {
            page.push(dummy[dummyIndex++]);
        }

        // 정확히 10개일 때만 페이지 추가
        if (page.length === POSTS_PER_PAGE) {
            paginatedPages.push(page);
        } else {
            break; // 10개가 안 되면 페이지 만들지 않음
        }
    }
}

async function loadCommentsCount(postId) {
    const q = query(collection(db, "comments"), where("postId", "==", postId));
    const snapshot = await getDocs(q);
    return snapshot.size;
}

function renderTable(posts, numDummyToShow) {
    tbody.querySelectorAll("tr:not(.dummy)").forEach(row => row.remove());

    posts.forEach((post, i) => {
        if (post.isDummy) return;

        const number = post.postNumber || (BASE_POST_NUM + i);
        const label = isIndex ? (categoryMap[post.category] || post.category) : post.subcategory;
        const dateStr = formatVirtualTime(post.timestamp);
        const views = post.views ?? 0;

        const row = document.createElement("tr");
        row.onclick = () => location.href = `post.html?id=${post.id}&from=${category || "index"}`;

        const commentSpanId = `comment-${post.id}`;
        row.innerHTML = !isIndex
            ? `
                <td class="post-number">${number}</td>
                <td class="category"><span>${label}</span></td>
                <td class="title">${post.title}<span class="comment-count" id="${commentSpanId}">[...]</span></td>
                <td class="post-time">${dateStr}</td>
                <td class="post-view">${views}</td>
            `
            : `
                <td class="category"><span>${label}</span></td>
                <td class="title">${post.title}<span class="comment-count" id="${commentSpanId}">[...]</span></td>
                <td class="post-time">${dateStr}</td>
                <td class="post-view">${views}</td>
            `;

        const firstDummy = tbody.querySelector(".dummy");
        if (firstDummy) {
            tbody.insertBefore(row, firstDummy);
        } else {
            tbody.appendChild(row);
        }

        loadCommentsCount(post.id).then(count => {
            const countSpan = document.getElementById(commentSpanId);
            if (countSpan) countSpan.textContent = `[${count}]`;
        });
    });

    // 더미 표시 조정
    const dummyEls = Array.from(document.querySelectorAll("tbody .dummy"));
    dummyEls.forEach((el, i) => {
        el.style.display = i < numDummyToShow ? '' : 'none';
    });
}

let realPosts = [];
let dummyPosts = [];

async function loadPosts() {
    const now = Date.now();
    const q = category
        ? query(collection(db, "posts"), where("category", "==", category), orderBy("timestamp", "desc"))
        : query(collection(db, "posts"), orderBy("timestamp", "desc"));

    const snapshot = await getDocs(q);
    realPosts = snapshot.docs
    .map(doc => {
        const data = doc.data();
        const scheduledTime = data.scheduledAt?.toMillis?.() || data.scheduledAt;
        return {
            id: doc.id,
            ...data,
            scheduledAt: scheduledTime
        };
    })
    .filter(post => !post.scheduledAt || post.scheduledAt <= Date.now());

    const dummyEls = document.querySelectorAll("tbody .dummy");
    dummyPosts = Array.from({ length: dummyEls.length }, (_, i) => ({ isDummy: true, id: `dummy-${i}` }));

    buildPaginatedPages();
    updatePage(1);
}

function renderPagination(currentPage) {
    const totalPages = paginatedPages.length;
    const maxPage = 181346;

    paginationContainer.innerHTML = "";

    const prevBtn = `<button class="prev-btn" ${currentPage === 1 ? 'disabled' : ''}><img src="./asset/pagebtn.png" /></button>`;
    const nextBtn = `<button class="next-btn" ${currentPage >= totalPages ? 'disabled' : ''}><img src="./asset/pagebtn.png" style="transform: rotate(180deg);" /></button>`;

    let pages = "";
    for (let i = 1; i <= 3; i++) {
        const isDisabled = i > totalPages;
        pages += `<span class="${i === currentPage ? "active" : ""} ${isDisabled ? "disabled" : ""}" ${isDisabled ? 'data-disabled="true"' : ""}>${i}</span>`;
    }
    pages += `<span class="dots">...</span><span class="fake-total disabled">${maxPage}</span>`;

    paginationContainer.innerHTML = prevBtn + pages + nextBtn;

    paginationContainer.querySelectorAll("span").forEach(span => {
        if (!span.dataset.disabled) {
            span.addEventListener("click", () => {
                const page = parseInt(span.textContent);
                if (!isNaN(page)) {
                    updatePage(page);
                }
            });
        }
    });

    paginationContainer.querySelector(".prev-btn")?.addEventListener("click", () => {
        if (currentPage > 1) {
            updatePage(currentPage - 1);
        }
    });

    paginationContainer.querySelector(".next-btn")?.addEventListener("click", () => {
        if (currentPage < totalPages) {
            updatePage(currentPage + 1);
        }
    });
}

function updatePage(page = currentPage) {
    const totalPages = paginatedPages.length;

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    currentPage = page;

    const postsThisPage = paginatedPages[page - 1] || [];
    const numDummyToShow = postsThisPage.filter(p => p.isDummy).length;

    renderTable(postsThisPage, numDummyToShow);
    renderPagination(currentPage);
}

loadPosts();