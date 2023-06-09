import styled from "styled-components";
import RoomList from "./RoomList";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateRoomModal from "./CreateRoomModal";
import axios from "axios";

const RoomListContainer = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);

  const [rooms, setRooms] = useState([]);
  const [next, setNext] = useState();
  const [curPage, setCurPage] = useState(page);
  const [previous, setPrevious] = useState();

  // useEffect(() => {
  //   const eventSource = new EventSource(
  //     `${process.env.REACT_APP_API_URL_V1}rooms/all?page=${page}`,
  //     {
  //       withCredentials: true,
  //     }
  //   );
  //   eventSource.onmessage = (event) => {
  //     const res = JSON.parse(event.data);

  //     if (res.statusCode === "OK") {
  //       setRooms(res.body.data);
  //       setNext(res.body.next);
  //       setCurPage(res.body.number);
  //       setPrevious(res.body.previous);
  //     } else {
  //       // 교통사고 처리해야됨
  //       console.error(`Error: ${event.status}`);
  //     }
  //   };
  //   return () => {
  //     eventSource.close();
  //   };
  // }, [page]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      axios
        .get(`${process.env.REACT_APP_API_URL_V1}rooms/all?page=${page}`, {
          withCredentials: true,
        })
        .then((response) => {
          const res = response.data;

          setRooms(res.data);
          setNext(res.next);
          setCurPage(res.number);
          setPrevious(res.previous);
        })
        .catch((error) => {
          console.error(`Error: ${error}`);
        });
    }, 1000); // 1초마다 요청
  
    return () => clearInterval(intervalId); // 컴포넌트가 언마운트될 때 clearInterval 함수를 호출하여 setInterval 함수를 중지시킵니다.
  }, [page]); // page가 변경될 때마다 실행

  
  const onClickLogout = () => {
    fetch(`${process.env.REACT_APP_API_URL_V1}members/logout`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        const success = data.success;
        if (success) {
          sessionStorage.removeItem("Auth");
          sessionStorage.removeItem("AuthExpiration");
          sessionStorage.removeItem("UserID");
          sessionStorage.removeItem("UserNickname");
          alert("로그 아웃 성공!");
          navigate("/");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("비정상 적인 요청 경로로 입장했습니다.");
        navigate("/");
      });
  };

  // 마이페이지 이동 버튼
  const onClickMypage = () => {
    navigate("/mypage");
  };

  // 다음 페이지 버튼 클릭 이벤트
  const onClickNext = async (next) => {
    if (next === true) {
      setPage(page + 1);
    } else {
      alert("마지막 페이지 입니다.");
    }
  };

  // 이전 페이지 버튼 클릭 이벤트
  const onClickPrevious = async (previous) => {
    if (previous === true) {
      setPage(page - 1);
    } else {
      alert("첫번째 페이지 입니다.");
    }
  };

  return (
    <Container className="container">
      <RoomListWrapper className="room-list-wrapper">
        <RoomList rooms={rooms} />
      </RoomListWrapper>
      <PageContainer className="page-container">
        <ArrowButton
          className="arrow-button left-arrow"
          onClick={() => onClickPrevious(previous)}
        >
          ◀
        </ArrowButton>
        <ArrowButton
          className="arrow-button right-arrow"
          onClick={() => onClickNext(next)}
        >
          ▶
        </ArrowButton>
      </PageContainer>
      <ButtonContainer className="button-container">
        <Button1 className="logout-button" onClick={onClickLogout}>
          Logout
        </Button1>
        <Button2 className="mypage-button" onClick={onClickMypage}>
          My Page
        </Button2>
        <CenteredText className="centered-text"></CenteredText>
        <CreateRoomModal />
      </ButtonContainer>
    </Container>
  );
};

export default RoomListContainer;

const Container = styled.div`
  background-color: black;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  z-index: 1;
  position: relative;
  width: 100%;
  min-height: 80vh;
`;

const RoomListWrapper = styled.div`
  width: 75%;
  height: 70%;
  margin-bottom: 7%;
  position: absolute;
`;

const ButtonContainer = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: black;
  margin-top: 10px;
  z-index: 1;
`;

const Button1 = styled.button`
  font-weight: bold;
  background-color: #64dfdf;
  color: #6930c3;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 100px;
  &:hover {
    background-color: #80ffdb;
  }
`;

const Button2 = styled.button`
  font-weight: bold;
  background-color: #64dfdf;
  color: #6930c3;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 100px;
  &:hover {
    background-color: #80ffdb;
  }
  margin-left: 1%;
`;

const CenteredText = styled.span`
  text-align: center;
  flex: 1;
`;

const ArrowButton = styled.button`
  background-color: #64dfdf;
  color: #6930c3;
  border: none;
  padding: 10px 20px;
  margin-left: 10px;
  cursor: pointer;
  border-radius: 100px;
  &:hover {
    background-color: #80ffdb;
  }
`;

const PageContainer = styled.div`
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
`;
