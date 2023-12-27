// 데이터 배열 초기화
const postData = [];


function addPost() {
    const postInput = document.getElementById("postInput");
    const postText = postInput.value;
    if (postText.trim() !== "") {
        // 새로운 포스트 업로드 시 위로 추가
        postData.unshift(postText);
        postInput.value = "";
        displayPosts();
    }
}

function displayPosts() {
    const postList = document.getElementById("postList");
    // 이전 목록을 지우고 새로운 목록 만듦
    postList.innerHTML = "";

    for (let i = 0; i < postData.length; i++) {

        // 각 포스트 감싸는 새로운 .section-block 생성
        const sectionBlock = document.createElement("div");
        sectionBlock.classList.add("section-block");
        
        // 포스트 내용 보여줄 p 요소 생성
        const postText = document.createElement("p");
        postText.textContent = postData[i];
        sectionBlock.appendChild(postText); // .section-block에 추가

        postList.appendChild(sectionBlock); // 목록에 추가
    }
}



// 페이지 로드 시, 저장된 데이터 복원
// window.onload = function () {
//     const storedData = JSON.parse(localStorage.getItem("postData"));
//     if (storedData) {
//         postData.push(...storedData);
//         displayPosts();
//     }
// };

// 페이지 로드 시, 데이터 저장
window.onbeforeunload = function () {
    localStorage.setItem("postData", JSON.stringify(postData));
};

//console.log("스크립트 실행됨")