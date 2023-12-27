//페이지 로드시 자동으로 게시글을 불러와서 표시
window.onload = fetchAndDisplayPosts;

// 파일 선택 시 이미지 미리보기
document.getElementById("fileInput").addEventListener("change", function () {
  const fileInput = this;
  const imagePreview = document.getElementById("imagePreview");
  imagePreview.innerHTML = "";

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const image = new Image();
      image.src = e.target.result;
      image.style.maxWidth = "100%";
      image.style.height = "auto";
      imagePreview.appendChild(image);
    };

    reader.readAsDataURL(fileInput.files[0]);
  }
});

//게시글을 불러와 화면에 표시하는 함수
async function fetchAndDisplayPosts() {
  try {
    //서버에서 기존 게시글 데이터 불러옴
    const response = await fetch("/getPosts");
    const data = await response.json();
    console.log(data);
    //화면에 게시글을 표시
    displayPosts(data.reverse());
  } catch (error) {
    console.error("게시글 불러오기 중 오류 발생");
  }
}

// 댓글 데이터를 불러오는 함수
async function fetchComments(postId) {
  try {
    const response = await fetch(`/getComments?postId=${postId}`);
    if (!response.ok) {
      throw new Error("서버 응답 오류");
    }
    const commentsData = await response.json();
    console.log("댓글 리턴 값 : ", commentsData);
    return commentsData;
  } catch (error) {
    console.error("댓글 불러오기 중 오류 발생:", error);
    return [];
  }
}

// 좋아요 개수
async function fetchLike(postId) {
  try {
    const response = await fetch(`/getLikeCnt?postId=${postId}`);
    if (!response.ok) {
      throw new Error("서버 응답 오류");
    }
    const like = await response.json();

    console.log("좋아요 리턴 값 : ", like.like_cnt);
    return like.like_cnt;
  } catch (error) {
    console.error("좋아요 불러오기 중 오류 발생:", error);
  }
}

async function fetchCommentCount(postId) {
  try {
    const response = await fetch(`/getComments?postId=${postId}`);
    if (!response.ok) {
      throw new Error("서버 응답 오류");
    }
    const commentsData = await response.json();
    console.log("댓글 개수 리턴 값 : ", commentsData.length);
    return commentsData.length;
  } catch (error) {
    console.error("댓글 불러오기 중 오류 발생:", error);
    return [];
  }
}

// 댓글을 화면에 표시하는 함수
function displayComments(commentsData) {
  const commentsContainer = document.getElementById("comments-container");
  commentsContainer.innerHTML = "";

  commentsData.forEach((comment) => {
    const commentElement = document.createElement("div");
    commentElement.classList.add("comment-box");

    // 날짜 형식 변환
    const commentDate = new Date(comment.date);

    const formattedDate = commentDate.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // 24시간 형식으로 표시
      timeZone: "Asia/Seoul", // 한국 시간대로 설정
    });

    commentElement.innerHTML = `
            <p id ="comment-date"> ${formattedDate}</p>
            <p id ="comment-text"> ${comment.text}</p>
            
        `;
    commentsContainer.appendChild(commentElement);
  });
}

// 가격을 통화 형식으로 포맷팅하는 함수
function formatPrice(price) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(price);
}

// 게시글을 HTML 문자열로 변환하여 화면에 표시하는 함수
function displayPosts(postsData) {
  console.log(postsData);
  const threadContainer = document.getElementById("thread-container");
  threadContainer.innerHTML = "";

  const limitedPosts = postsData;
  console.log(limitedPosts);

  limitedPosts.forEach((postInfo, index) => {
    // console.log(postInfo);
    const postDate = new Date(postInfo.date);
    const postElement = document.createElement("div");
    postElement.classList.add("post-box");
    postElement.innerHTML = `
      <div class = "font">
      <p><strong>작성자:</strong> ${postInfo.nickname}</p>
      <p><strong>게시일:</strong> ${postDate.toLocaleDateString()}</p>
      <p><strong>가격:</strong> ${formatPrice(postInfo.price)}</p>
      <p><strong>내용:</strong> ${postInfo.text}</p>
      </div>
      `;
    //클릭 이벤트 리스너 추가
    postElement.onclick = function () {
      openModalWithPost(postInfo);
    };
    console.log("여긴 메인페이지 displayPosts");
    threadContainer.appendChild(postElement);
  });
}

//게시글을 저장하고 화면을 갱신하는 함수
async function savePost() {
  const postDate = document.getElementById("date");
  const postPrice = document.getElementById("price");
  const postContent = document.getElementById("post-content");
  const fileInput = document.getElementById("fileInput");

  if (postDate && postPrice && postContent) {
    const postInfo = {
      postDate: postDate.value,
      postPrice: postPrice.value,
      postContent: postContent.value,
    };

    // FormData 객체 생성
    const formData = new FormData();
    formData.append("postDate", postDate.value);
    formData.append("postPrice", postPrice.value);
    formData.append("postContent", postContent.value);

    // 이미지 파일이 선택되었을 때만 FormData에 추가
    if (fileInput.files.length > 0) {
      formData.append("file", fileInput.files[0]);
    }

    console.log(formData.fileInput);
    try {
      //서버에 post요청으로 데이터 전송(db저장을 위해)
      console.log(postInfo);
      const response = await fetch("/savePost", {
        method: "POST",
        body: formData,
      });

      // 여기서 서버 응답 처리
      const data = await response.json();

      if (data.message) {
        console.log(data.message);
        //서버에 저장된 게시글 데이터를 다시 가져와서 화면 갱신
        closePostModal();
        await fetchAndDisplayPosts();
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (error) {
      console.error("게시물 저장 중 오류 발생:", error);
    }
  } else {
    console.error("요소를 찾을 수 없거나 값이 비어 있습니다.");
  }

  // 1. 미리보기 영역 초기화
  document.getElementById("imagePreview").innerHTML = "";

  // 2. 입력 필드 초기화

  document.getElementById("price").value = "";
  document.getElementById("post-content").value = "";
  document.getElementById("fileInput").value = "";
  document.getElementById("date").value = new Date()
    .toISOString()
    .substring(0, 10);
}

//게시글 입력 창 열기
function openPostModal() {
  let modal = document.getElementById("post-modal");
  modal.style.display = "block";
  // 새로운 글을 작성할 때 이전 내용 초기화
  document.getElementById("post-content").value = "";
}

//게시글 입력 창 끄기
function closePostModal() {
  // 모달 창의 HTML 엘리먼트를 가져옵니다.
  let modal = document.getElementById("post-modal");

  // 1. 미리보기 영역 초기화
  document.getElementById("imagePreview").innerHTML = "";

  // 2. 입력 필드 초기화
  document.getElementById("date").value = new Date()
    .toISOString()
    .substring(0, 10);
  document.getElementById("price").value = "";
  document.getElementById("post-content").value = "";
  document.getElementById("fileInput").value = "";

  // 모달 창을 숨기도록 스타일을 변경합니다.
  modal.style.display = "none";
}

// 게시글 창 열기 함수
async function openModalWithPost(postInfo) {
  const modal = document.getElementById("myModal");
  const modalContent = document.getElementById("modalContent");
  const postDate = new Date(postInfo.date);
  console.log(postInfo.image_path);

  modalContent.innerHTML = `
      <div class = "font">
        <table border = "1" id="myTable" class="table" style="overflow: auto;">
          <tr class="price">
          <td>${postInfo.nickname}</td>
          </tr>

          <tr class="price" >     
          <td>${postDate.toLocaleDateString()}</td>
          </tr>

          <tr class="price">
          <td>${formatPrice(postInfo.price)}</td>
          </tr>

          <tr>
          <td>${postInfo.text}</td>
          </tr>
          <tr>
          <td>${
            postInfo.image_path
              ? `<img src="${postInfo.image_path}" alt="게시물 이미지" style="max-width: 50%; max-height: 40%;">`
              : ""
          }</td>
            </tr>
        </table>
        </div>
        `;

  const comment_cnt = await fetchCommentCount(postInfo.post_id);
  const like_cnt = await fetchLike(postInfo.post_id);
  // 댓글 관련 영역
  modalContent.innerHTML += `
  <div class = "font">
         <div class="comments-header">
            <span class="comments-count">댓글 ${comment_cnt}개 </span>

            <span class="likes-count" >좋아요 ${like_cnt}개 </span>
            <div><button class="like-button" id="like-button">좋아요 ❤️</button> 
         </div>
            
          </div>
        
          <div id="comments-section">
            <p><b>Comment</b></p>
            <textarea id="comment-input" placeholder="댓글을 입력하세요." style =" height: 30px" ></textarea>
            <button class="comment-button" onclick="postComment(${postInfo.post_id})">댓글 작성 💬 </button>
            <div id="comments-container"></div>
          </div>
          </div>
        `;

  // 모달을 보이게 합니다.
  modal.style.display = "block";

  // 댓글 띄우기
  const commentsData = await fetchComments(postInfo.post_id);
  displayComments(commentsData);

  // 좋아요 버튼 클릭 이벤트 리스너 추가
  const likeButton = document.querySelector(".like-button");
  likeButton.addEventListener("click", async () => {
    const postId = postInfo.post_id;

    // 좋아요 개수 증가
    const newLikeCount = await increaseLikeCount(postId);

    if (newLikeCount !== -1) {
      // UI에 좋아요 개수 업데이트
      const likesCountElement = document.querySelector(".likes-count");
      likesCountElement.textContent = `좋아요 ${newLikeCount}개`;
    }
  });

  // 추가: 모달 외부를 클릭하면 모달이 닫히도록 설정
  window.onclick = function (event) {
    const modal = document.getElementById("myModal"); // 모달의 ID를 'myModal'로 수정
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

async function increaseLikeCount(postId) {
  try {
    // 현재 좋아요 개수 가져오기
    const currentLikeCount = await fetchLike(postId);

    // 증가된 좋아요 개수 계산
    const newLikeCount = currentLikeCount + 1;

    // 서버에 좋아요 개수 업데이트 요청 보내기
    const response = await fetch(`/updateLike?postId=${postId}`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("서버 응답 오류");
    }

    // 업데이트된 좋아요 개수 반환
    return newLikeCount;
  } catch (error) {
    console.error("좋아요 개수 업데이트 중 오류 발생:", error);
    return -1; // 오류 발생 시 -1을 반환하거나 다른 오류 처리 방법을 선택할 수 있습니다.
  }
}

// 댓글을 서버로 전송하고 페이지에 추가하는 함수
async function postComment(postId) {
  const commentContent = document.getElementById("comment-input").value;

  if (commentContent.trim() === "") {
    alert("댓글 내용을 입력하세요.");
    return;
  }

  try {
    const response = await fetch("/saveComment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postId, commentContent }),
    });

    if (response.ok) {
      const commentsContainer = document.getElementById("comments-container");
      const commentsCountElement = document.querySelector(".comments-count"); // 댓글 개수를 표시하는 요소 찾기

      // 날짜 형식 변환

      const commentDate = new Date();

      const formattedDate = commentDate.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true, // 24시간 형식으로 표시
        timeZone: "Asia/Seoul", // 한국 시간대로 설정
      });

      // 새 댓글 요소 생성
      const newComment = document.createElement("div");
      newComment.className = "comment-box"; // CSS 클래스 적용
      newComment.innerHTML = `
            <p id="comment-date">${formattedDate}</p>
            <p id="comment-text">${commentContent}</p>
            
        `;

      // 페이지에 새 댓글 추가
      commentsContainer.appendChild(newComment);
      document.getElementById("comment-input").value = ""; // 입력 필드 초기화

      // 댓글 개수 업데이트
      const currentCount = parseInt(
        commentsCountElement.textContent.match(/\d+/)[0]
      );
      commentsCountElement.textContent = `댓글 ${currentCount + 1}개`;
    } else {
      const errorData = await response.json();
      alert(errorData.error);
    }
  } catch (error) {
    console.error("댓글 저장 중 오류 발생:", error);
  }
}
