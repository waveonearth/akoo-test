import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-storage.js";

// Firebase 설정
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
const storage = getStorage(app);

const params = new URLSearchParams(window.location.search);
const boardParam = params.get("board");
const editId = params.get("edit");

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

let selectedCategory = boardParam || "미지정";
let selectedSubhead = "잡담";

const VALID_USERS = {
    "admin": "baekakie",
    "차연": "yeon_0826"
};

const username = document.getElementById("username").value.trim();
const password = document.getElementById("password").value.trim();

// category label 초기 세팅
if (boardParam && categoryMap[boardParam]) {
    document.getElementById("category-label").textContent += categoryMap[boardParam];
}

document.querySelectorAll("#subhead-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
        selectedSubhead = btn.dataset.value;
        document.querySelectorAll("#subhead-buttons button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

let editorInstance;
ClassicEditor.create(document.querySelector('#editor'))
    .then(editor => {
        editorInstance = editor;
        if (editId) loadEditData(editor);
    })
    .catch(err => console.error(err));

async function loadEditData(editor) {
    const docRef = doc(db, "posts", editId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return alert("글 데이터를 불러올 수 없습니다.");
    const data = snap.data();

    document.getElementById("title").value = data.title;
    editor.setData(data.content);
    selectedSubhead = data.subcategory;
    document.getElementById("username").value = data.username || "";

    // 카테고리 라벨 수정
    if (data.category && categoryMap[data.category]) {
        selectedCategory = data.category;
        document.getElementById("category-label").textContent = `${categoryMap[data.category]}`;
    }

    document.querySelectorAll("#subhead-buttons button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.value === selectedSubhead);
    });
}

window.submitPost = async function () {
    if (!editorInstance) {
        alert("에디터 로딩 중입니다. 잠시 후 시도해주세요.");
        return;
    }

    const title = document.getElementById("title").value.trim();
    const rawContent = editorInstance.getData();
    const textOnly = rawContent.replace(/<[^>]*>/g, "").trim();
    const subcategory = selectedSubhead;

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();


    if (!title || !textOnly || !subcategory || !username || !password) {
        alert("제목, 내용, 말머리, 유저명, 비밀번호를 입력해주세요.");
        return;
    }

    if (!(username in VALID_USERS) || VALID_USERS[username] !== password) {
        alert("유저명과 비밀번호가 일치하지 않습니다.");
        return;
    }

    // 예약 발행 값 처리
    const scheduleInput = document.getElementById("scheduleTime")?.value;
    let scheduledAt = null;
    let isScheduled = false;

    if (scheduleInput) {
        scheduledAt = new Date(scheduleInput).getTime();
        if (scheduledAt > Date.now()) {
            isScheduled = true;
        }
    }
    
    try {
        if (editId) {
            await updateDoc(doc(db, "posts", editId), {
                title,
                content: rawContent,
                subcategory
            });
            alert("수정되었습니다.");
        } else {
            const snap = await getDocs(query(collection(db, "posts"), orderBy("postNumber", "desc")));
            const latestNum = snap.empty ? 169620 : (snap.docs.find(doc => !doc.data().isDummy)?.data().postNumber || 169620);
            const newPostNumber = latestNum + 1;

            await addDoc(collection(db, "posts"), {
                title,
                content: rawContent,
                subcategory,
                category: selectedCategory,
                postNumber: newPostNumber,
                createdAt: serverTimestamp(),
                timestamp: isScheduled ? scheduledAt : Date.now(),
                commentsCount: 0,
                views: 0,
                isDummy: false,
                scheduledAt: isScheduled ? scheduledAt : null,
                username,
                password
            });
            alert("글이 등록되었습니다.");
        }
        window.location.href = `${selectedCategory}.html`;
    } catch (err) {
        console.error("업로드 실패:", err);
        alert("업로드 실패: " + err.message);
    }
};