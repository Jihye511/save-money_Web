const express = require("express");
const router = require("../../login/routes/auth");
const fs = require("fs");
const db = require("../../mysql/index");
const bodyParser = require("body-parser");

// 클릭한 날짜의 price 값을 가져오는 코드
router.post("/challenge", async (req, res) => {
  try {
    const { date } = req.body;
    const user_id = req.session.kakao.id; // 세션에서 user_id 가져오기

    // 데이터베이스에서 클릭한 날짜에 해당하는 price 값 가져오기
    const result = await db.query("calendarFind", [user_id, date]);

    // price 값을 더하기
    const totalPrice = result.reduce((acc, entry) => acc + entry.price, 0);

    // 10000원 초과인지 여부 확인
    const isOver10000 = totalPrice > 10000;

    // 응답으로 전송할 데이터
    const responseData = {
      totalPrice,
      isOver10000,
    };

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// // 챌린지 성공한 날짜 db에 넣는 코드
// router.post("/challenge/save", async (req, res) => {
//   try {
//     console.log("try문 성공");
//     const { successDate } = req.body;
//     const userId = req.session.kakao.id; // 사용자의 Kakao ID를 세션에서 가져오는 부분
//     console.log(userId, "id를 지금 받아오니?");

//     // // 사용자의 Kakao ID로 DB에서 해당 사용자의 ID를 가져오는 쿼리
//     // const userIdResult = await db.query("calendarCheck", [userId]);

//     // if (userIdResult.length === 0) {
//     //   // 해당 사용자의 ID가 존재하지 않으면 캘린더 테이블에 새로운 레코드를 삽입
//     //   await db.query("calendarInsert_id", [userId]);
//     //   console.log("여긴성공?");
//     // }

//     // 챌린지 성공 날짜를 캘린더 테이블에 저장하는 쿼리
//     const result = await db.query("calendarInsert", [userId, successDate]);
//     console.log("챌린지 날짜 들어가니?");

//     res.status(200).json({ message: "올ㅋ 챌린지 도전에 성공하셨습니다." });
//   } catch (error) {
//     console.error("Error saving challenge stamp:", error);
//     res
//       .status(500)
//       .json({ error: "챌린지 도장을 저장하는 중에 오류가 발생했습니다." });
//   }
// });

router.post("/challenge/save", async (req, res) => {
  try {
    console.log("try문 성공");
    const { successDate } = req.body;
    const userId = req.session.kakao.id; // 사용자의 Kakao ID를 세션에서 가져오는 부분
    console.log(userId, "id를 지금 받아오니?");

    // 챌린지 성공 날짜를 캘린더 테이블에 저장하는 쿼리
    const result = await db.query("calendarInsert", [userId, successDate]);
    console.log("챌린지 날짜 들어가니?");

    res.status(200).json({ message: "올ㅋ 챌린지 도전에 성공하셨습니다." });
  } catch (error) {
    console.error("Error saving challenge stamp:", error);
    res
      .status(500)
      .json({ error: "챌린지 도장을 저장하는 중에 오류가 발생했습니다." });
  }
});

// reload시 도장 찍혀있게
router.get("/challenge/stamps", async (req, res) => {
  try {
    if (!req.session || !req.session.kakao || !req.session.kakao.id) {
      const errorMessage = "로그인이 필요합니다.";
      console.error(errorMessage);

      // Send a response to the client indicating the need for login
      return res.status(401).json({ error: errorMessage });
    }

    const userId = req.session.kakao.id;
    console.log(userId);

    const dates = await db.query("calendarList", [userId]);
    console.log(dates);
    res.json({ dates, userId });
  } catch (error) {
    console.error("Error fetching stamps:", error);
    res
      .status(500)
      .json({ error: "도장 정보를 불러오는 중에 오류가 발생했습니다." });
  }
});

module.exports = router;
