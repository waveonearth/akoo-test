import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
    getFirestore, doc, getDoc, updateDoc, increment,
    collection, addDoc, deleteDoc, query, where, orderBy, onSnapshot
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
//const MASTER_PASSWORD = "baekakie";

const postId = new URLSearchParams(window.location.search).get("id");
const from = new URLSearchParams(window.location.search).get("from") || "index";

function formatVirtualTime(timestamp) {
    const realNow = new Date();
    const virtualNow = new Date(realNow);
    //virtualNow.setFullYear(virtualNow.getFullYear() - 8);
    //virtualNow.setMonth(virtualNow.getMonth() - 5);

    const postTime = new Date(timestamp);
    const virtualPostTime = new Date(postTime);
    //virtualPostTime.setFullYear(virtualPostTime.getFullYear() - 8);
    //virtualPostTime.setMonth(virtualPostTime.getMonth() - 5);

    const diff = virtualNow - virtualPostTime;
    const diffHr = Math.floor(diff / (1000 * 60 * 60));

    if (diffHr < 24) {
        // hh:mm 포맷
        return `${String(virtualPostTime.getHours()).padStart(2, '0')}:${String(virtualPostTime.getMinutes()).padStart(2, '0')}`;
    }

    return `${virtualPostTime.getFullYear()}/${String(virtualPostTime.getMonth() + 1).padStart(2, '0')}/${String(virtualPostTime.getDate()).padStart(2, '0')}`;
}

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

async function loadPost() {
    if (!postId) return;
    const docRef = doc(db, "posts", postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        
        document.getElementById("post-title").textContent = data.title;
        document.getElementById("post-title-head").textContent = data.title;
        document.getElementById("post-body").innerHTML = data.content;
        document.getElementById("category-name").textContent = categoryMap[data.category] || data.category;
        document.getElementById("post-author").textContent = "익명의 재채기";
        document.getElementById("post-date").textContent = formatVirtualTime(data.timestamp);
        document.getElementById("post-views").textContent = data.views || 0;
        document.getElementById("back-to-category").href = from + ".html";

        await updateDoc(docRef, { views: increment(1) });
    } else {
        alert("글을 찾을 수 없습니다.");
    }
}

document.getElementById("delete-post").addEventListener("click", async () => {
    const inputUser = prompt("작성자 이름을 입력하세요:");
    const inputPw = prompt("비밀번호를 입력하세요:");

    const snap = await getDoc(doc(db, "posts", postId));
    const data = snap.data();
    if (data.username !== inputUser || data.password !== inputPw) {
        return alert("작성자 정보가 일치하지 않습니다.");
    }

    await deleteDoc(doc(db, "posts", postId));
    alert("삭제되었습니다.");
    window.location.href = `${data.category}.html`;
});

document.getElementById("edit-post").addEventListener("click", async () => {
    const inputUser = prompt("작성자 이름을 입력하세요:");
    const inputPw = prompt("비밀번호를 입력하세요:");

    const snap = await getDoc(doc(db, "posts", postId));
    const data = snap.data();
    if (data.username !== inputUser || data.password !== inputPw) {
        return alert("작성자 정보가 일치하지 않습니다.");
    }

    window.location.href = `write.html?edit=${postId}`;
});

loadPost();
window.postId = postId;
//window.MASTER_PASSWORD = MASTER_PASSWORD;
window.formatVirtualTime = formatVirtualTime;