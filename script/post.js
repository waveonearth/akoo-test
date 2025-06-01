import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
    getFirestore, doc, getDoc, updateDoc, increment,
    collection, addDoc, deleteDoc, query, where, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBhwO39QcKN_aiQSNZH8Q6CwbY_PWOA6kE",
    authDomain: "khunternews-552f4.firebaseapp.com",
    projectId: "khunternews-552f4",
    storageBucket: "khunternews-552f4.appspot.com",
    messagingSenderId: "387777217028",
    appId: "1:387777217028:web:413e36ecdb8483b95e6b51",
    measurementId: "G-K5B13765FC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const MASTER_PASSWORD = "baekakie";

const postId = new URLSearchParams(window.location.search).get("id");
const from = new URLSearchParams(window.location.search).get("from") || "index";

function formatVirtualTime(timestamp) {
    const realNow = new Date();
    const virtualNow = new Date(realNow);
    virtualNow.setFullYear(virtualNow.getFullYear() - 0);
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

let postData = null;

async function loadPost() {
    if (!postId) return;
    const docRef = doc(db, "posts", postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();

        document.getElementById("post-body").innerHTML = data.content;

        requestAnimationFrame(() => {
            convertOembed();
        });
        
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

function convertOembed() {
    document.querySelectorAll("oembed[url]").forEach(el => {
        const url = el.getAttribute("url");
        const embedUrl = url.replace("youtu.be/", "www.youtube.com/embed/").split("?")[0];

        const iframe = document.createElement("iframe");
        iframe.src = embedUrl;
        iframe.width = "100%";
        iframe.height = "360";
        iframe.frameBorder = "0";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;

        el.replaceWith(iframe);
    });
}

document.getElementById("delete-post").addEventListener("click", async () => {
    const pw = prompt("비밀번호를 입력하세요:");
    if (pw === MASTER_PASSWORD) {
        await deleteDoc(doc(db, "posts", postId));
        alert("삭제되었습니다.");
        window.location.href = `${from}.html`;
    } else {
        alert("비밀번호가 틀렸습니다.");
    }
});

document.getElementById("edit-post").addEventListener("click", () => {
    window.location.href = `write.html?edit=${postId}&from=${from}`;
});

loadPost();
window.postId = postId;
window.MASTER_PASSWORD = MASTER_PASSWORD;
window.formatVirtualTime = formatVirtualTime;