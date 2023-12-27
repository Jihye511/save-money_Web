// 인증 관련 로직 처리
const axios = require('axios');
const qs = require('qs');
const kakaoConfig = require('../config/kakao');
const express = require('express');
const router = express.Router();
const mysql = require("../../mysql/index");


exports.redirectToKakao = (req, res) => {
    // 카카오 인증 페이지로 리다이렉트하는 로직
    const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoConfig.clientID
    }&redirect_uri=${kakaoConfig.redirectUri}&response_type=code&scope=profile_nickname,profile_image`;
    res.redirect(kakaoAuthURL);
};

exports.handleKakaoCallback = async (req, res) => {
    // 카카오 로그인 콜백 처리 로직
    let tokenResponse;
    try {
        // 토큰 요청
        tokenResponse  = await axios({
            method: 'POST',
            url: 'https://kauth.kakao.com/oauth/token',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            data: qs.stringify({
                grant_type: 'authorization_code',
                client_id: kakaoConfig.clientID,
                client_secret: kakaoConfig.clientSecret,
                redirect_uri: kakaoConfig.redirectUri,
                code: req.query.code
            })
        });

        // 토큰을 세션에 저장
        const { access_token, refresh_token } = tokenResponse.data;
        req.session.kakaoToken = { access_token, refresh_token };

    } catch (err) {
        return res.status(500).json(err.data);
    }

    let userResponse;

    try {
        // 사용자 정보 요청
        userResponse = await axios({
            method: 'GET',
            url: 'https://kapi.kakao.com/v2/user/me',
            headers: {
                Authorization: `Bearer ${tokenResponse .data.access_token}`
            }
        });

        // 사용자 정보를 세션에 저장
        req.session.kakaoUser = userResponse.data;

    } catch (err) {
        return res.status(500).json(err.data);
    }

    req.session.kakao = userResponse.data;

    const kakao_id = req.session.kakao.id;
    // kakao_id 를 기준으로 중복값 있는지 확인
    try {
        const result = await mysql.query("checkIdDupli", [kakao_id]);
        if (result[0].count == 0) {
            // 데이터베이스에 저장!
            const user = {
                kakao_id : kakao_id,
                nickname : req.session.kakao.properties.nickname,
                image :  req.session.kakao.properties.thumbnail_image,
            }
            const user_result = await mysql.query("userInsert", user);
        }
    } catch (error) {
        // 오류 처리
        console.error('Signup Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

    //res.send('로그인 성공!');
    res.redirect('/');
};

// 사용자 정보
exports.renderHomePage = async(req, res) => {
    let displayNickname = '로그인 해주세요';
    let displayImage = 'img/profile-img.jpg';
    let loggedIn = false;
    let level = "Bronze";

    if (req.session.kakao) {
        // 세션에 카카오 정보가 있으면 템플릿 변수로 전달
        displayNickname = req.session.kakao.properties.nickname + '님';
        displayImage = req.session.kakao.properties.thumbnail_image;
        loggedIn = true; // 로그인 상태를 true로 설정
        userRanking =  await mysql.query("userLevel", req.session.kakao.id);
        level = userRanking[0].level;
    }

    res.render('index', {
        nickname: displayNickname,
        user_image: displayImage,
        loggedIn: loggedIn,
        ranking: level
    });

};

// mypage 렌더링을 위한 새 함수
exports.renderMyPage = async (req, res) => {
    let displayNickname = '로그인 해주세요';
    let displayImage = 'img/profile-img.jpg';
    let loggedIn = false;
    let level = "Bronze";

    if (req.session.kakao) {
        // 세션에 카카오 정보가 있으면 템플릿 변수로 전달
        displayNickname = req.session.kakao.properties.nickname + '님';
        displayImage = req.session.kakao.properties.thumbnail_image;
        loggedIn = true; // 로그인 상태를 true로 설정
        userRanking =  await mysql.query("userLevel", req.session.kakao.id);
        level = userRanking[0].level;
    }

    res.render('mypage', {
        nickname: displayNickname,
        user_image: displayImage,
        loggedIn: loggedIn,
        ranking: level
    });
};

// challenge 렌더링을 위한 새 함수
exports.renderChallenge = async (req, res) => {
    let displayNickname = '로그인 해주세요';
    let displayImage = 'img/profile-img.jpg';
    let loggedIn = false;
    let level = "Bronze";

    if (req.session.kakao) {
        // 세션에 카카오 정보가 있으면 템플릿 변수로 전달
        displayNickname = req.session.kakao.properties.nickname + '님';
        displayImage = req.session.kakao.properties.thumbnail_image;
        loggedIn = true; // 로그인 상태를 true로 설정
        userRanking =  await mysql.query("userLevel", req.session.kakao.id);
        level = userRanking[0].level;
    }

    res.render('challenge', {
        nickname: displayNickname,
        user_image: displayImage,
        loggedIn: loggedIn,
        ranking: level
    });
};





// 로그아웃 기능
exports.logoutFromKakao = async (req, res) => {
    delete req.session.kakao;
    res.redirect('/?msg=logoutsuccess');
}

// 회원 탈퇴 기능
exports.unlinkKakaoAccount = async (req, res) => {
    if (!req.session.kakao) {
        return res.status(401).send('로그인 되어있지 않습니다.');
    }

    try {
        // 카카오 회원 탈퇴 API 호출
        await axios({
            method: 'POST',
            url: 'https://kapi.kakao.com/v1/user/unlink',
            headers: {
                'Authorization': `Bearer ${req.session.kakaoToken.access_token}`
            }
        });

        // 데이터베이스에서 사용자 정보 삭제
        if (req.session.kakao) {
            // 세션에 카카오 정보가 있으면 템플릿 변수로 전달
            const user_result = await mysql.query("userDelete", req.session.kakao.id);
        }

        // 세션에서 사용자 정보 삭제
        req.session.destroy();

        //res.send('회원 탈퇴 처리가 완료되었습니다.');
        res.redirect('/?msg=inlinkSuccess');

    } catch (error) {
        console.error(error);
        res.status(500).send('회원 탈퇴 처리 중 오류가 발생했습니다.');
    }
};