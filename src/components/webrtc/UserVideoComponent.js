import React from "react";
import OpenViduVideoComponent from "./OvVideo";
import styled from "styled-components";
import "./UserVideo.css";

const UserVideoComponent = (props) => {
  const getNicknameTag = () => {
    // Gets the nickName of the user
    return JSON.parse(props.streamManager.stream.connection.data).clientData;
  };

  return (
    <div>
      <div>
        {props.streamManager !== undefined ? (
          <div className="streamcomponent">
            <OpenViduVideoComponent streamManager={props.streamManager} />
          </div>
        ) : null}
      </div>
      <Nickname>{getNicknameTag()}</Nickname>
    </div>
  );
};

export default UserVideoComponent;

const Nickname = styled.div`
  text-align: center;
  font-weight: bold;
  margin-top: 12px;
  color: #fff;
  font-size: 20px;
`;
