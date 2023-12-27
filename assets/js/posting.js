const { Router } = require("express");
const express = require("express"); // express 모듈 추가
const router = require("../../login/routes/auth");
const fs = require("fs");
// const authRouter  = express.Router();
const multer = require("multer");
const path = require("path");

// // 페이로드 크기 제한 늘리기
// authRouter.use(express.json({ limit: '50mb' }));
// authRouter.use(express.urlencoded({ extended: true, limit: '50mb' }));

const upload = multer({ dest: "uploads/" }); // uploads/는 이미지를 저장할 디렉토리

// const storage = multer.memoryStorage(); // 파일 데이터를 메모리에 저장
// const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });

const bodyParser = require("body-parser");
const dbPool = require("../../mysql/index");

router.get("/", function (req, res, next) {
  fs.readFile("/index.njk", (err, data) => {
    if (err) {
      res.send("error");
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(data);
      res.end();
    }
  });
});

// post 불러오기
router.get("/getPosts", (req, res) => {
  try {
    // console.log("getPosts 들어옴");
    dbPool.query("postList", (err, results) => {
      if (err) {
        console.error("게시글 불러오기 중 mysql 오류", err);
        res.status(500).json({ error: "게시글을 불러오는 동안 오류가 발생" });
      } else {
        res.json(results);
      }
    });
  } catch (error) {
    console.error("게시글 불러오기 중 오류 발생", error);
    res.status(500).json({ error: "게시글을 불러오는 동안 오류 발생" });
  }
  // const sortedPosts = postsDatabase.slice().reverse();
  // res.status(200).json(sortedPosts);
});

//마이페이지 게시물불러오기
router.get("/getUserPosts", async (req, res) => {
  try {
    // 세션에서 사용자 ID를 가져오기 전에 해당 객체와 프로퍼티가 존재하는지 확인
    if (!req.session || !req.session.kakao || !req.session.kakao.id) {
      const errorMessage = "로그인이 필요합니다.";
      console.error(errorMessage);
      // 에러 메시지를 클라이언트로 전송
      return res.status(500).json({ error: errorMessage });
    }

    const postInfo_user = {
      kakao_id: req.session.kakao.id,
      nickname: req.session.kakao.properties.nickname,
    };

    console.log(postInfo_user.kakao_id);

    console.log("getPosts 들어옴");
    const user_post = await dbPool.query("postUserList", [
      postInfo_user.kakao_id,
    ]);
    res.json(user_post);

    console.log("게시물 불러오기 성공:");
  } catch (error) {
    console.error("게시글 불러오기 중 오류 발생", error);
    res.status(500).json({ error: "게시글을 불러오는 동안 오류 발생" });
  }
});

// post 저장하기
router.post("/savePost", upload.single("file"), async (req, res) => {
  try {
    const post_id = req.params.post_id;

    const postInfo = {
      date: req.body.postDate,
      price: req.body.postPrice,
      content: req.body.postContent,
      kakao_id: req.session.kakao.id,
      nickname: req.session.kakao.properties.nickname,
    };
    console.log(postInfo.nickname, "닉네임");
    console.log(postInfo.kakao_id, "카카오아이디");

    // 이미지 파일이 전송된 경우 파일 경로를 postInfo에 추가
    if (req.file) {
      const filePath = req.file.path;
      const urlPath = filePath.replace(/\\/g, "/");
      postInfo.image_path = urlPath;
    }
    console.log(req.file);
    console.log(postInfo.image_path);

    // console.log(postInfo)
    if (postInfo && postInfo.content) {
      const content = postInfo.content.trim();

      if (content !== "") {
        const formattedDate = new Date(postInfo.date)
          .toISOString()
          .slice(0, 10);

        console.log("Before query execution");
        try {
          // 이미지 파일 경로를 포함하여 쿼리 실행
          const result = await dbPool.query("postInsert", [
            formattedDate,
            postInfo.price,
            postInfo.content,
            postInfo.kakao_id,
            postInfo.nickname,
            postInfo.image_path, // 이미지 파일 경로 추가
          ]);
          console.log("저장 완료!");

          // // calendar에도 kakao_id 저장
          // const submit = await dbPool.query("calendarInsert_id", [
          //   postInfo.kakao_id,
          // ]);

          res
            .status(200)
            .json({ message: "게시물이 성공적으로 저장되었습니다." });
        } catch (err) {
          console.error("게시물 저장 중 MySQL 오류:", err);
          res
            .status(500)
            .json({ error: "게시물을 저장하는 동안 오류가 발생했습니다." });
        }
        console.log("After query execution");
      }
    }
  } catch (error) {
    console.error("Error during savepost:", error);
  }
});

// 좋아요 개수 가져오기
router.get("/getLikeCnt", async (req, res) => {
  try {
    const postId = req.query.postId;

    // 데이터베이스에서 좋아요 개수 가져오기
    const post_like = await dbPool.query("likeCount", [postId]);
    res.json(post_like[0]);
    console.log("좋아요 개수", post_like[0]);
  } catch {}
});

// 좋아요 버튼 누르면 증가시키기
router.post("/updateLike", async (req, res) => {
  if (!req.session || !req.session.kakao || !req.session.kakao.id) {
    const errorMessage = "로그인이 필요합니다.";
    console.error(errorMessage);
    // 에러 메시지를 클라이언트로 전송
    return res.status(500).json({ message: errorMessage });
  }
  const postId = req.query.postId;

  await dbPool.query("likeUpdate", [postId]);
  res.status(200).json({ message: "좋아요가 성공적으로 업데이트 되었습니다." });
});

// 댓글 저장하기
router.post("/saveComment", async (req, res) => {
  try {
    if (!req.session || !req.session.kakao || !req.session.kakao.id) {
      const errorMessage = "로그인이 필요합니다.";
      console.error(errorMessage);
      // 에러 메시지를 클라이언트로 전송
      return res.status(500).json({ error: errorMessage });
    }

    // 요청 본문에서 postId와 commentContent를 추출
    const { postId, commentContent } = req.body;
    console.log("댓글에서 확인 : ", req.body);
    const userId = req.session.kakao.id;
    // 현재 날짜와 시간
    const commentDate = new Date(); // 예시로 현재 날짜 및 시간을 사용합니다.

    const currentDate = commentDate.toISOString();

    // 댓글 저장 로직 (예: MySQL 데이터베이스에 저장)
    await dbPool.query("commentInsert", [
      postId,
      userId,
      commentContent,
      currentDate,
    ]);

    res.status(200).json({ message: "댓글이 성공적으로 저장되었습니다." });
  } catch (error) {
    console.error("댓글 저장 중 오류 발생:", error);
    res.status(500).json({ error: "댓글을 저장하는 동안 오류 발생" });
  }
});

// 댓글 불러오기
router.get("/getComments", async (req, res) => {
  try {
    const postId = req.query.postId;
    // 데이터베이스에서 postId에 해당하는 댓글 조회
    const comment_post = await dbPool.query("commentList", [postId]);

    // 조회된 댓글 데이터를 JSON 형식으로 클라이언트에 전송
    res.json(comment_post);
  } catch (error) {
    // 오류 발생 시 클라이언트에 오류 메시지 전송
    console.error("댓글 조회 중 오류 발생:", error);
    res
      .status(500)
      .json({ error: "댓글을 불러오는 동안 오류가 발생했습니다." });
  }
});

// post.js 또는 해당 라우트 파일 내
router.delete("/deletePost", async (req, res) => {
  const postId = req.query.postId;

  // 데이터베이스에서 해당 postId를 가진 포스트를 삭제하는 로직
  try {
    await dbPool.query("postDelete", [postId]);
    res.status(200).json({ message: "포스트가 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("포스트 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "포스트를 삭제하는 동안 오류 발생" });
  }
});

function saveComment() {
  let commentContent = document.getElementById("comment-content").value;

  if (commentContent.trim() !== "") {
    let commentElement = document.createElement("div");
    commentElement.classList.add("comment");
    commentElement.textContent = commentContent;

    currentPost
      .getElementsByClassName("comments-container")[0]
      .appendChild(commentElement);

    // 댓글 저장 후 내용 초기화
    document.getElementById("comment-content").value = "";
    updateCommentModal(); // 댓글이 업데이트될 때 해당 모달 창만 업데이트
  } else {
    alert("댓글 내용을 입력하세요.");
  }
}

function updateCommentModal() {
  let commentsContainer = document.getElementById("comments-container");
  commentsContainer.innerHTML = "";

  let existingComments = currentPost.getElementsByClassName("comment");
  for (let i = 0; i < existingComments.length; i++) {
    let commentElement = document.createElement("div");
    commentElement.classList.add("comment");
    commentElement.textContent = existingComments[i].textContent;
    commentsContainer.appendChild(commentElement);
  }
}

module.exports = router;
