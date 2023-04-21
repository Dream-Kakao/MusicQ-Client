import React, { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import styled from "styled-components";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import axios from "axios";

const StyledBox = styled(Box)`
  && {
    min-width: 120px;
  }
`;

const StyledFormControl = styled(FormControl)`
  && {
    width: 100%;
    margin-top: 16px;
  }
`;

const StyledSelect = styled(Select)`
  && {
    border-radius: 4px;
    background-color: #252525;
    color: #64dfdf;

    border: 1px solid #252525;
  }

  &:focus {
    background-color: #e0e0e0;
  }

  label {
    color: #6930c3;
  }
`;

const StyledInputLabel = styled(InputLabel)`
  && {
    color: #6930c3;
    font-size: 18px;
    font-weight: bold;
  }
`;

const CreateRoomButton = styled(Button)`
  && {
    width: 100%;
    height: auto;
    background: #64dfdf;
    border: 2px solid #64dfdf;
    border-radius: 100px;
    font-weight: bold;
    font-size: 16px;
    color: #6930c3;
  }
`;

const CustomDialog = styled(Dialog)`
  .MuiDialog-paper {
    background-color: #252525;
    border: 1px solid black;
    border-radius: 8px;
    box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.3);
  }

  .MuiDialogTitle-root {
    background-color: #64dfdf;
    color: #6930c3;
    font-weight: bold;
    font-size: 20px;
  }

  .MuiDialogContent-root {
    padding: 24px;
    font-size: 16px;
    line-height: 1.5;
    color: white;
  }

  .MuiDialogActions-root {
    padding: 16px;
  }

  .MuiButton-containedPrimary {
    color: white;
    background-color: #007bff;
    &:hover {
      background-color: #0069d9;
    }
  }
`;

const DialogCreateButton = styled(Button)`
  && {
    width: 20%;
    height: auto;
    background: #64dfdf;
    border: 2px solid #64dfdf;
    border-radius: 100px;
    font-weight: bold;
    font-size: 16px;
    color: #6930c3;
  }
`;

const DialogCancelButton = styled(Button)`
  && {
    width: 20%;
    height: auto;
    background: #64dfdf;
    border: 2px solid #64dfdf;
    border-radius: 100px;
    font-weight: bold;
    font-size: 16px;
    color: #6930c3;
  }
`;

const RoomName = styled(TextField)`
  label.Mui-focused {
    color: #6930c3;
  }
  .MuiOutlinedInput-root {
    color: white;
    &:hover fieldset {
      border-color: #6930c3;
    }
    &.Mui-focused fieldset {
      border-color: #6930c3;
    }
  }
  & .MuiInputBase-input {
    color: #64dfdf; // 바꾸고 싶은 색상으로 변경
  }

  & .MuiOutlinedInput-notchedOutline {
    border-color: #64dfdf; /* 원하는 색상으로 변경 */
  }

  label {
    color: #6930c3;
  }

  margin-bottom: 20px;
`;

export default function FormDialog() {
  const [open, setOpen] = useState(false); // Dialog의 open 여부를 관리하는 state 변수
  const [roomName, setRoomName] = useState(""); // 방 제목을 관리하는 state 변수
  const [gameType, setGameType] = useState("낭독퀴즈"); // 게임 종류를 관리하는 state 변수
  const [sessionId, setSessionId] = useState("");

  const handleClickOpen = async () => {
    setOpen(true); // 모달창 먼저 열기

    try {
      const sessionId = await axios.post(
        `${process.env.REACT_APP_API_URL_V1}rooms/create`
      );
      console.log(sessionId);
      console.log(sessionId.data);
      setSessionId(sessionId.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleGameTypeChange = (e) => {
    setGameType(e.target.value);
  };

  const handleRoomNameChange = (e) => {
    setRoomName(e.target.value);
  };

  const handleCreate = async () => {
    try {
      const requestBody = {
        roomTitle: roomName,
        gameName: gameType,
      };
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL_V1}rooms/create/${sessionId}`,
        requestBody
      );
      console.log(response);
      console.log(response.data);
      setOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <CreateRoomButton variant="outlined" onClick={handleClickOpen}>
        방 생성
      </CreateRoomButton>
      <CustomDialog open={open} onClose={handleClose}>
        <DialogTitle>방 생성</DialogTitle>
        <DialogContent>
          <RoomName
            autoFocus
            margin="dense"
            id="roomName"
            label="방 제목"
            type="text"
            fullWidth
            variant="outlined"
            value={roomName}
            onChange={handleRoomNameChange}
          />
          <StyledBox sx={{ minWidth: 120 }}>
            <StyledFormControl fullWidth>
              <StyledInputLabel id="gameType">게임장르</StyledInputLabel>
              <StyledSelect
                labelId="gameType"
                id="gameSelect"
                value={gameType}
                label="게임종류"
                onChange={handleGameTypeChange}
              >
                <MenuItem value={"낭독퀴즈"}>낭독퀴즈</MenuItem>
              </StyledSelect>
            </StyledFormControl>
          </StyledBox>
        </DialogContent>
        <DialogActions>
          <DialogCreateButton onClick={handleCreate}>생성</DialogCreateButton>
          <DialogCancelButton onClick={handleClose}>취소</DialogCancelButton>
        </DialogActions>
      </CustomDialog>
    </div>
  );
}
