const MASTER_PASSWORD = "baekakie"; // 마스터 비밀번호

document.addEventListener("DOMContentLoaded", () => {
    const writeBtn = document.getElementById("writeBtn");
    if (writeBtn) {
        writeBtn.addEventListener("click", () => {
            const pw = prompt("비밀번호를 입력하세요");
            if (pw === MASTER_PASSWORD) {
                const currentCategory = new URLSearchParams(window.location.search).get("board") || "huntertalk";
                window.location.href = `write.html?board=${currentCategory}`;
            } else {
                alert("비밀번호가 틀렸습니다.");
            }
        });
    }
});