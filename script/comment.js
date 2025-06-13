import {
    getFirestore,
    doc,
    deleteDoc,
    updateDoc,
    increment,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const db = getFirestore();

// 외부에서 공유
const postId = window.postId;
const formatVirtualTime = window.formatVirtualTime;
//const MASTER_PASSWORD = window.MASTER_PASSWORD;

let commentIndex = 1;

function displayComment(comment) {
    const li = document.createElement("li");
    li.className = "comment-item";

    const nickname = `익명의 재채기 ${commentIndex++}`;
    const time = formatVirtualTime(comment.timestamp);

    li.innerHTML = `
        <div class="comment-meta">
            <span class="comment-nickname">${nickname}</span>
            <span class="comment-date">${time}</span>
        </div>
        <div class="comment-body">
            <p class="comment-text">${comment.text}</p>
        </div>
        <div class="comment-actions">
            <span class="edit-btn">수정</span>
            <span class="delete-btn">삭제</span>
        </div>
    `;

    // 수정 박스
    const editBox = document.createElement("div");
    editBox.className = "edit-box";
    editBox.style.display = "none";
    editBox.innerHTML = `
        <textarea class="edit-textarea">${comment.text}</textarea>
        <button class="submit-edit">수정 완료</button>
    `;
    li.appendChild(editBox);

    // 삭제 이벤트
    li.querySelector(".delete-btn").addEventListener("click", async () => {
        const inputUser = prompt("작성자 이름을 입력하세요:");
        const inputPw = prompt("비밀번호를 입력하세요:");
        if (inputUser !== comment.username || inputPw !== comment.password) {
            return alert("작성자 정보가 일치하지 않습니다.");
        }

        await deleteDoc(doc(db, "comments", comment.id));
    });

    // 수정 이벤트
    li.querySelector(".edit-btn").addEventListener("click", async () => {
        const inputUser = prompt("작성자 이름을 입력하세요:");
        const inputPw = prompt("비밀번호를 입력하세요:");
        if (inputUser !== comment.username || inputPw !== comment.password) {
            return alert("작성자 정보가 일치하지 않습니다.");
        }

        document.querySelectorAll(".edit-box").forEach(b => b.style.display = "none");
        editBox.style.display = "block";
    });

    li.querySelector(".submit-edit").addEventListener("click", async () => {
        const newText = li.querySelector(".edit-textarea").value.trim();
        if (!newText) return;

        await updateDoc(doc(db, "comments", comment.id), {
            text: newText
        });
        editBox.style.display = "none";
    });

    document.getElementById("comments-list").appendChild(li);
}

function loadComments() {
    const q = query(collection(db, "comments"), where("postId", "==", postId), orderBy("timestamp", "asc"));
    onSnapshot(q, snapshot => {
        const commentList = document.getElementById("comments-list");
        commentList.innerHTML = "";
        commentIndex = 1;
        snapshot.forEach(doc => displayComment({ ...doc.data(), id: doc.id }));
        document.getElementById("comment-count").textContent = snapshot.size;
    });
}

const VALID_USERS = {
    "admin": "baekakie",
    "차연": "yeon_0826"
};

function setupCommentEvents() {
    document.getElementById("submit-comment").addEventListener("click", async () => {
        const username = document.getElementById("comment-username").value.trim();
        const password = document.getElementById("comment-password").value.trim();
        const text = document.getElementById("comment-input").value.trim();

        if (!username || !password || !text) {
            return alert("이름, 비밀번호, 댓글을 모두 입력해주세요.");
        }

        if (VALID_USERS[username] !== password) {
            return alert("유효하지 않은 사용자 이름 또는 비밀번호입니다.");
        }

        // 등록 전에 비밀번호 요청
        //const pw = prompt("비밀번호를 입력하세요:");
        //if (pw !== MASTER_PASSWORD) {
        //    alert("비밀번호가 틀렸습니다.");
        //    return;
        //}

        if (window.editingCommentId) {
            const docRef = doc(db, "comments", window.editingCommentId);
            const snap = await getDoc(docRef);
            const data = snap.data();
            if (data.username !== username || data.password !== password) {
                return alert("작성자 정보가 일치하지 않습니다.");
            }

            await updateDoc(docRef, { text });
            window.editingCommentId = null;
        } else {
            await addDoc(collection(db, "comments"), {
                postId,
                text,
                timestamp: Date.now(),
                username,
                password
            });

            await updateDoc(doc(db, "posts", postId), {
                commentsCount: increment(1)
            });
        }

        document.getElementById("comment-input").value = "";
        document.getElementById("comment-username").value = "";
        document.getElementById("comment-password").value = "";
    });

    document.getElementById("refresh-comments").addEventListener("click", loadComments);
}

// 실행
loadComments();
setupCommentEvents();