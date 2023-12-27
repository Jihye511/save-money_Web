// mypost는 게시글 불러오는걸 자기 아이디에 해당되는 것만 뽑아서 불러오기 
 

//사용자의 아이디로 작성한 게시글만 불러오기
// async function fetchAndDisplayPosts() {
//     try {
//       // 로그인한 사용자의 아이디 가져오기 (가정)
//       const userId = getLoggedInUserId(); // 이 함수는 실제 상황에 맞게 수정해야 합니다.
  
//       // 서버에서 로그인한 사용자의 아이디로 작성된 게시글 데이터 불러오기
//       const response = await fetch(`/getPosts?userId=${userId}`);
//       const data = await response.json();
//       console.log(data);
  
//       // 화면에 게시글을 표시
//       displayPosts(data.reverse());
  
//     } catch (error) {
//       console.error('게시글 불러오기 중 오류 발생');
//     }
//   }
 //게시글을 불러와 화면에 표시하는 함수
 async function fetchAndDisplayPosts(){
    try{
      //서버에서 기존 게시글 데이터 불러옴
      const response = await fetch("/getPosts");
      const data = await response.json();
      console.log(data);
      //화면에 게시글을 표시
      displayPosts(data.reverse());

    }catch (error){
      console.error('게시글 불러오기 중 오류 발생');
    }
  }

  
  // 게시글을 HTML 문자열로 변환하여 화면에 표시하는 함수
  function displayPosts(postsData){
    console.log(postsData);
    const threadContainer = document.getElementById('thread-container');
    threadContainer.innerHTML='';

    const limitedPosts = postsData.slice(0, 6);
    console.log(limitedPosts);
    limitedPosts.forEach((postInfo,index)=>{
      const postDate = new Date(postInfo.date);
      const postElement = document.createElement('div');
      postElement.classList.add('post-box');
      postElement.innerHTML=`
      <p><strong>게시일:</strong> ${postDate.toLocaleDateString()}</p>
      <p><strong>가격:</strong> ${postInfo.price}</p>
      <p><strong>내용:</strong> ${postInfo.text}</p>
      `;
      //클릭 이벤트 리스너 추가
      postElement.onclick= function(){
        openModalWithPost(postInfo);
      };

      threadContainer.appendChild(postElement);
    })
   
  }
  //페이지 로드시 자동으로 게시글을 불러와서 표시
  window.onload = fetchAndDisplayPosts;



  //게시글을 저장하고 화면을 갱신하는 함수
  async function savePost(){

    const postDate= document.getElementById('date');
    const postPrice= document.getElementById('price');
    const postContent= document.getElementById('post-content');

    if(postDate && postPrice && postContent){
      const postInfo ={
        postDate: postDate.value,
        postPrice: postPrice.value,
        postContent: postContent.value
      };
      try{
        //서버에 post요청으로 데이터 전송(db저장을 위해)
        console.log(postInfo);
        const response = await fetch('/savePost',{
          
          method:'POST',
          headers:{
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postInfo)
        });

        if (response.ok) {
          console.log('게시물이 성공적으로 저장되었습니다.');
          //서버에 저장된 게시글 데이터를 다시 가져와서 화면 갱신
          closePostModal();
          await fetchAndDisplayPosts();
          // closePostModal();
          // displayPosts();
        } else {
            const errorData = await response.json();
            alert(errorData.error);
        }
      } catch (error) {
        console.error('게시물 저장 중 오류 발생:', error);
      }
    }else {
        console.error('요소를 찾을 수 없거나 값이 비어 있습니다.');
    }
  }

  //게시글 입력 창 열기
  function openPostModal() {
      let modal = document.getElementById('post-modal');
      modal.style.display = 'block';
      // 새로운 글을 작성할 때 이전 내용 초기화
      document.getElementById('post-content').value = '';
  }

  //게시글 입력 창 끄기
  function closePostModal() {
      // 모달 창의 HTML 엘리먼트를 가져옵니다.
      let modal = document.getElementById('post-modal');

      // 모달 창을 숨기도록 스타일을 변경합니다.
      modal.style.display = 'none';
  }



  

  // 게시글 창 열기 함수
  function openModalWithPost(postInfo) {
    const modal = document.getElementById('myModal');
    const modalContent = document.getElementById('modalContent');
      console.log('클릭한 게시글의 정보:', postInfo);
      modalContent.innerHTML = `
    <p><strong>게시일:</strong> ${postInfo.date}</p>
    <p><strong>가격:</strong> ${postInfo.price}</p>
    <p><strong>내용:</strong> ${postInfo.text}</p>
    `;
    // 모달을 보이게 합니다.
    modal.style.display = 'block';

    // 추가: 모달 외부를 클릭하면 모달이 닫히도록 설정
    window.onclick = function(event) {
        const modal = document.getElementById('myModal'); // 모달의 ID를 'myModal'로 수정
        if (event.target == modal) {
          modal.style.display = 'none';
        }
      };
  }
  
  