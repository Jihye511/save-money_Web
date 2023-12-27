module.exports = {
  userList: `select * from user_table`,
  userInsert: `insert into user_table set ?`,
  userDelete: `DELETE FROM user_table WHERE kakao_id = ?`,
  checkIdDupli: `SELECT COUNT(*) AS count FROM user_table WHERE kakao_id = ?`,

  userLevel: `SELECT level FROM user_table WHERE kakao_id = ?`,

  postInsert: `INSERT INTO post (date, price, text, user_id, nickname, image_path) VALUES (?, ?, ?, ?, ?, ?)`,
  postList: `SELECT * FROM post`,
  postUserList: `SELECT * FROM post WHERE user_id = ?`,
  postDelete: `DELETE FROM post WHERE post_id = ?`,

  likeUpdate: `UPDATE post SET like_cnt = like_cnt + 1 WHERE post_id = ?`,
  likeCount: `SELECT like_cnt FROM post WHERE post_id = ?`,

  commentInsert: `INSERT INTO comment_table (post_id, user_id, text, date) VALUES (?, ?, ?, ?)`,
  commentList: `SELECT * FROM comment_table WHERE post_id = ?`,

  calendarFind: `SELECT * FROM post WHERE user_id = ? AND date = ?;`,
  calendarInsert: `INSERT INTO calendar_table (user_id,success_date) VALUES (?,?)`,
  calendarList: `SELECT success_date FROM calendar_table WHERE user_id = ?`,

  // 임시로 과제에 사용했던 거 넣어둠
  // 이게 아마 개 많을 것으로 예상
};
