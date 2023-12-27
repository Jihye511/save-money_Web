const express = require("express");
const nunjucks = require("nunjucks");
const session = require("express-session");
const path = require("path");
const authRouter = require("./login/routes/auth");
const authController = require("./login/controllers/authController"); // auth 라우터를 가져옵니다.
const app = express();
const cors = require("cors");


const postRouter = require("./assets/js/posting");
const challengeRouter = require("./assets/js/challenge");

// Nunjucks 템플릿 엔진 설정
app.set("view engine", "njk");
nunjucks.configure("assets", {
  express: app,
  autoescape: true,
});
app.use(express.json({
  limit: '50mb'
}));
app.use(express.urlencoded({
  limit: '50mb',
  extended: false
}))
// 정적 파일 제공을 위한 설정
app.use(express.static(path.join(__dirname, "assets")));

app.use(cors());
// 세션 설정
app.use(
  session({
    resave: true,
    saveUninitialized: false,
    secret: "ras",
    secure: false,
  })
);


// uploads 디렉토리를 정적 파일로 서빙
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// 라우터 설정
app.use("/auth", authRouter); // auth 경로 설정
// 로그인 후 사용자 정보 가져오는 설정
app.get("/", authController.renderHomePage);
//메인기본화면
app.use("/", postRouter);

// mypage
app.get('/mypage', authController.renderMyPage);
app.get('/challenge', authController.renderChallenge);
// 서버 시작

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`${PORT}번 포트에서 서버 대기 중입니다.`);
});

module.exports = app;
