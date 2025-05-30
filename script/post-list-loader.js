// post-list-loader.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    startAfter,
    doc,
    getDoc
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
let lastVisible = null;

const tableBody = document.querySelector(".post-list tbody");

function formatDate(timestamp) {
    const realBase = new Date("2025-05-30T00:00:00Z");
    const virtualBase = new Date("2016-12-30T00:00:00Z");
    const now = new Date();
    const offset = now - realBase;
    const virtualNow = new Date(virtualBase.getTime() + offset);

    const date = new Date(timestamp);
    const diff = virtualNow - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (mins < 60) return `${mins}분 전`;
    if (hours < 24) return `${hours}시간 전`;

    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

function createRow(post) {
    const tr = document.createElement("tr");
    const link = `post.html?id=${post.id}&from=index`;
    const view = post.data().views || 0;

    tr.innerHTML = `
        <td class="category"><span>${post.data().category || "기타"}</span></td>
        <td class="title">
        <a href="${link}">${post.data().title}</a>
        <span class="comment-count">[${post.data().commentsCount || 0}]</span>
        </td>
        <td class="post-time">${formatDate(new Date(post.data().timestamp))}</td>
        <td class="post-view">${view}</td>
    `;

    return tr;
}

async function loadPosts() {
    const q = lastVisible
        ? query(collection(db, "posts"), orderBy("timestamp", "desc"), startAfter(lastVisible), limit(POSTS_PER_PAGE))
        : query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(POSTS_PER_PAGE));

    const snapshot = await getDocs(q);
    if (snapshot.docs.length > 0) {
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
        snapshot.docs.forEach(doc => {
        const row = createRow(doc);
        tableBody.appendChild(row);
        });
    }
}

window.addEventListener("DOMContentLoaded", () => {
    loadPosts();

    const nextBtn = document.querySelector(".next-btn");
    if (nextBtn) nextBtn.addEventListener("click", loadPosts);
});