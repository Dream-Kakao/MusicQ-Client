import { OpenVidu } from "openvidu-browser";

import axios from "axios";
import styled from "styled-components";
import Youtube from 'react-youtube';
import React, { Component } from "react";
import { MultiSelect } from "react-multi-select-component";
import { Button, Box } from "@material-ui/core";

import UserVideoComponent from "./UserVideoComponent";
import "./Openvidu.css";

const APPLICATION_SERVER_URL =
  process.env.NODE_ENV === "production" ? "" : "http://localhost/api/v1/";

class OpenviduDefault extends Component {
  constructor(props) {
    super(props);

    // These properties are in the state's component in order to re-render the HTML whenever their values change
    this.state = {
      mySessionId: "SessionC",
      myUserName: "Participant" + Math.floor(Math.random() * 100),
      session: undefined,
      mainStreamManager: undefined, // Main video of the page. Will be the 'publisher' or one of the 'subscribers'
      publisher: undefined,
      subscribers: [],
      // music
      musics: [], // axios로 노래관련된 것들을 받아올 배열
      musicSelected: [], // MultiSet에서 고른 노래들을 담을 배열
      // youtube
      player: null,
      playlist: [], // 선택한 음악(musicSelected)의 videoId만 가져와서 넣어놓은 배열
      //musicIndex: 0, // 지금 플레이할 음악의 인덱스
    };

    this.joinSession = this.joinSession.bind(this);
    this.leaveSession = this.leaveSession.bind(this);
    this.switchCamera = this.switchCamera.bind(this);
    this.handleChangeSessionId = this.handleChangeSessionId.bind(this);
    this.handleChangeUserName = this.handleChangeUserName.bind(this);
    this.handleMainVideoStream = this.handleMainVideoStream.bind(this);
    this.onbeforeunload = this.onbeforeunload.bind(this);
    // music
    this.handleMusicSelected = this.handleMusicSelected.bind(this);
    // youtube
    this.handleReadyMusic = this.handleReadyMusic.bind(this); // 플레이어 준비
    this.handlePlayMusic = this.handlePlayMusic.bind(this); // 음악 재생
  }

  componentDidMount() {
    window.addEventListener("beforeunload", this.onbeforeunload);

    axios({
      method: 'get',
      url: APPLICATION_SERVER_URL + "musics/all",
      withCredentials: true,
    })
      .then((response) => {
        this.setState({ musics: response.data });
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.onbeforeunload);
  }

  onbeforeunload(event) {
    this.leaveSession();
  }

  handleChangeSessionId(e) {
    this.setState({
      mySessionId: e.target.value,
    });
  }

  handleChangeUserName(e) {
    this.setState({
      myUserName: e.target.value,
    });
  }

  handleMainVideoStream(stream) {
    if (this.state.mainStreamManager !== stream) {
      this.setState({
        mainStreamManager: stream,
      });
    }
  }

  deleteSubscriber(streamManager) {
    let subscribers = this.state.subscribers;
    let index = subscribers.indexOf(streamManager, 0);
    if (index > -1) {
      subscribers.splice(index, 1);
      this.setState({
        subscribers: subscribers,
      });
    }
  }

  joinSession() {
    // --- 1) Get an OpenVidu object ---

    this.OV = new OpenVidu();

    // --- 2) Init a session ---

    this.setState(
      {
        session: this.OV.initSession(),
      },
      () => {
        var mySession = this.state.session;

        // --- 3) Specify the actions when events take place in the session ---

        // On every new Stream received...
        mySession.on("streamCreated", (event) => {
          // Subscribe to the Stream to receive it. Second parameter is undefined
          // so OpenVidu doesn't create an HTML video by its own
          var subscriber = mySession.subscribe(event.stream, undefined);
          var subscribers = this.state.subscribers;
          subscribers.push(subscriber);

          // Update the state with the new subscribers
          this.setState({
            subscribers: subscribers,
          });
        });

        // On every Stream destroyed...
        mySession.on("streamDestroyed", (event) => {
          // Remove the stream from 'subscribers' array
          this.deleteSubscriber(event.stream.streamManager);
        });

        // On every asynchronous exception...
        mySession.on("exception", (exception) => {
          console.warn(exception);
        });

        // --- 4) Connect to the session with a valid user token ---

        // Get a token from the OpenVidu deployment
        this.getToken().then((token) => {
          // First param is the token got from the OpenVidu deployment. Second param can be retrieved by every user on event
          // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
          mySession
            .connect(token, { clientData: this.state.myUserName })
            .then(async () => {
              // --- 5) Get your own camera stream ---

              // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
              // element: we will manage it on our own) and with the desired properties
              let publisher = await this.OV.initPublisherAsync(undefined, {
                audioSource: undefined, // The source of audio. If undefined default microphone
                videoSource: undefined, // The source of video. If undefined default webcam
                publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
                publishVideo: true, // Whether you want to start publishing with your video enabled or not
                resolution: "640x480", // The resolution of your video
                frameRate: 30, // The frame rate of your video
                insertMode: "APPEND", // How the video is inserted in the target element 'video-container'
                mirror: false, // Whether to mirror your local video or not
              });

              // --- 6) Publish your stream ---

              mySession.publish(publisher);

              // Obtain the current video device in use
              var devices = await this.OV.getDevices();
              var videoDevices = devices.filter(
                (device) => device.kind === "videoinput"
              );
              var currentVideoDeviceId = publisher.stream
                .getMediaStream()
                .getVideoTracks()[0]
                .getSettings().deviceId;
              var currentVideoDevice = videoDevices.find(
                (device) => device.deviceId === currentVideoDeviceId
              );

              // Set the main video in the page to display our webcam and store our Publisher
              this.setState({
                currentVideoDevice: currentVideoDevice,
                mainStreamManager: publisher,
                publisher: publisher,
              });
            })
            .catch((error) => {
              console.log(
                "There was an error connecting to the session:",
                error.code,
                error.message
              );
            });
        });
      }
    );
  }

  leaveSession() {
    // --- 7) Leave the session by calling 'disconnect' method over the Session object ---

    const mySession = this.state.session;

    if (mySession) {
      mySession.disconnect();
    }

    // Empty all properties...
    this.OV = null;
    this.setState({
      session: undefined,
      subscribers: [],
      mySessionId: "SessionA",
      myUserName: "Participant" + Math.floor(Math.random() * 100),
      mainStreamManager: undefined,
      publisher: undefined,
    });
  }

  async switchCamera() {
    try {
      const devices = await this.OV.getDevices();
      var videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      if (videoDevices && videoDevices.length > 1) {
        var newVideoDevice = videoDevices.filter(
          (device) => device.deviceId !== this.state.currentVideoDevice.deviceId
        );

        if (newVideoDevice.length > 0) {
          // Creating a new publisher with specific videoSource
          // In mobile devices the default and first camera is the front one
          var newPublisher = this.OV.initPublisher(undefined, {
            videoSource: newVideoDevice[0].deviceId,
            publishAudio: true,
            publishVideo: true,
            mirror: true,
          });

          //newPublisher.once("accessAllowed", () => {
          await this.state.session.unpublish(this.state.mainStreamManager);

          await this.state.session.publish(newPublisher);
          this.setState({
            currentVideoDevice: newVideoDevice[0],
            mainStreamManager: newPublisher,
            publisher: newPublisher,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 노래에 관련된 useState
  handleMusicSelected(musicSelected) {
    const playlist = musicSelected.map(music => {
      return JSON.parse(music.value).videoId;
    });

    this.setState({
      musicSelected: musicSelected,
      playlist: playlist,
    });
  }

  // 플레이어를 지금 상태대로 셋팅
  handleReadyMusic(event) {
    this.setState({
      player: event.target
    });
  };

  // 플레이어를 가져와서 음악을 재생
  handlePlayMusic(event) {
    const player = this.state.player;
    const musicSelected = this.state.musicSelected;

    // 선택된 노래가 없는 경우 alert
    if (musicSelected.length === 0) {
      alert("선택된 노래가 없어요 ¯＼_(ツ)_/¯");
      return;
    }

    player.playVideo();

    // // musicIndex를 1 증가 시킴(다음 노래 준비)
    // this.setState((prev) => ({
    //   musicIndex: (prev.musicIndex + 1) % musicSelected.length,
    // }));
  }

  render() {
    const mySessionId = this.state.mySessionId;
    const myUserName = this.state.myUserName;
    const playlist = this.state.playlist;
    //const musicIndex = this.state.musicIndex;

    // 음악을 고르기 위한 옵션 - value는 "musicId_videoId처럼 만들어지게 됨."
    const options = this.state.musics.map((music) => ({
      label: `${music.musicTitle} - ${music.singer}`,
      value: JSON.stringify({
        musicId: music.musicId,
        videoId: music.videoId,
      }),
    }));

    return (
      // join session 하는 페이지. 추 후에 지워야 됨.
      // container로 잡혀있기 때문에 자동으로 width가 85% 로 줄어들게 됨. 추 후에 이 부분만 줄이던가 해야될듯?
      <div className="container">
        {this.state.session === undefined ? (
          <div id="join">
            <div id="img-div">
              <img
                src="resources/images/openvidu_grey_bg_transp_cropped.png"
                alt="OpenVidu logo"
              />
            </div>
            <div id="join-dialog" className="jumbotron vertical-center">
              <h1> Join a video session </h1>
              <form className="form-group" onSubmit={this.joinSession}>
                <p>
                  <label>Participant: </label>
                  <input
                    className="form-control"
                    type="text"
                    id="userName"
                    value={myUserName}
                    onChange={this.handleChangeUserName}
                    required
                  />
                </p>
                <p>
                  <label> Session: </label>
                  <input
                    className="form-control"
                    type="text"
                    id="sessionId"
                    value={mySessionId}
                    onChange={this.handleChangeSessionId}
                    required
                  />
                </p>
                <p className="text-center">
                  <input
                    className="btn btn-lg btn-success"
                    name="commit"
                    type="submit"
                    value="JOIN"
                  />
                </p>
              </form>
            </div>
          </div>
        ) : null}

        {/* 세션을 보여주는 페이지
          this.state.session이 없다면 페이지를 보여주면 안된다. */}
        {this.state.session !== undefined ? (
          <div id="session">
            {/* body 내 헤더 부분. 고정 쌉가능 */}
            <div id="session-header">
              <h1 id="session-title">{mySessionId}</h1>
              <input
                className="btn btn-large btn-danger"
                type="button"
                id="buttonLeaveSession"
                onClick={this.leaveSession}
                value="Leave session"
              />
              <input
                className="btn btn-large btn-success"
                type="button"
                id="buttonSwitchCamera"
                onClick={this.switchCamera}
                value="Switch Camera"
              />
            </div>

            {/* 문제가 생기는 부분.
              publisher는 1 명이고, subscriber는 n 명인데
              왜 다 publisher로 잡히는걸까? */}

            {/* body 내 body~footer 부분. */}
            <HeaderStyle id="video-container">
              {/* publisher 화면이 나오게 하는 부분 */}
              {this.state.publisher !== undefined ? (
                <PublisherCard
                  className="stream-container"
                  onClick={() =>
                    this.handleMainVideoStream(this.state.publisher)
                  }
                >
                  <UserVideoComponent streamManager={this.state.publisher} />
                </PublisherCard>
              ) : null}

              {/* subscriber 화면이 나오게 하는 부분 */}
              {this.state.subscribers.map((sub, i) => (
                <SubScriberCard
                  key={sub.id}
                  className="stream-container"
                  onClick={() => this.handleMainVideoStream(sub)}
                >
                  <span>{sub.id}</span>
                  <UserVideoComponent streamManager={sub} />
                </SubScriberCard>
              ))}
            </HeaderStyle>

            {/* youtube - 안 보이게 숨겨놨음! */}
            <S.YoutubeWrapper hidden>
              <Youtube
                id='iframe'
                videoId={playlist[0]}
                opts={{
                  width: 400,
                  height: 300,
                  playerVars: {
                    disablekb: 1, // 플레이어가 키보드 컨트롤에 응답하지 않음
                    start: 1, // 재생 구간의 시작(초)
                    end: 10, // 재생 구간의 끝(초)
                  },
                }}
                onReady={this.handleReadyMusic}
                onEnd={this.handleReadyMusic}
              />
            </S.YoutubeWrapper>

            <AllofButtons>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "15%",
                  gap: "10px",
                }}
              >
                <MultiSelect
                  options={options}
                  value={this.state.musicSelected}
                  onChange={this.handleMusicSelected}
                  labelledBy={"노래를 골라주세요."}
                  isCreatable={true}
                />
                <ShowParticipant>0/5</ShowParticipant>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "15%",
                  gap: "10px",
                }}
              >
                {this.state.publisher !== undefined ? (
                  <ReadyButton variant="contained">게임시작</ReadyButton>
                ) : null}
                <ExitButton variant="outlined">나가기</ExitButton>
                <ExitButton onClick={this.handlePlayMusic}>정답</ExitButton>
              </div>
            </AllofButtons>
          </div>
        ) : null}
      </div>
    );
  }

  /**
   * --------------------------------------------
   * GETTING A TOKEN FROM YOUR APPLICATION SERVER
   * --------------------------------------------
   * The methods below request the creation of a Session and a Token to
   * your application server. This keeps your OpenVidu deployment secure.
   *
   * In this sample code, there is no user control at all. Anybody could
   * access your application server endpoints! In a real production
   * environment, your application server must identify the user to allow
   * access to the endpoints.
   *
   * Visit https://docs.openvidu.io/en/stable/application-server to learn
   * more about the integration of OpenVidu in your application server.
   */
  async getToken() {
    const sessionId = await this.createSession(this.state.mySessionId);
    return await this.createToken(sessionId);
  }

  async createSession(sessionId) {
    const response = await axios.post(
      APPLICATION_SERVER_URL + "rooms/create",
      { customSessionId: sessionId },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data; // The sessionId
  }

  async createToken(sessionId) {
    const response = await axios.post(
      APPLICATION_SERVER_URL + "rooms/enter/" + sessionId,
      {},
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data.data; // The token
  }
}

export default OpenviduDefault;

// 화면 중 사람들 얼굴 보여주는 부분
const HeaderStyle = styled.div`
  display: flex;
  width: 100%;
  background: #252525;
  border: 2px solid #6930c3;
  border-radius: 20px;
`;

const PublisherCard = styled.div`
  display: inline-block;
  width: calc(100% / 5);
  height: auto;
  border-radius: 20px;
  background: #6930c3;
  /* width: 70px; */
  margin: 1em;
  padding: 0.8em;
  box-shadow: 1px 3px 8px rgba(0, 0, 0, 100);
`;

const SubScriberCard = styled.div`
  display: inline-block;
  width: calc(100% / 5);
  height: auto;
  border-radius: 20px;
  background: #64dfdf;
  margin: 1em;
  padding: 0.8em;
  box-shadow: 1px 3px 8px rgba(0, 0, 0, 100);
`;

const AllofButtons = styled.div`
  display: flex;
  background: #252525;
  justify-content: space-between;
  width: 100%;
  padding: 10px;
  height: 30%;
`;

const ExitButton = styled(Button)`
  && {
    width: 100%;
    height: auto;
    border: 2px solid #64dfdf;
    border-radius: 5px;
    font-weight: bold;
    font-size: 13px;
    color: #6930c3;
  }
`;

const ReadyButton = styled(Button)`
  && {
    width: 100%;
    height: auto;
    border-radius: 5px;
    background: #6930c3;
    font-weight: bold;
    font-size: 13px;
    color: #64dfdf;
  }
`;

const ShowParticipant = styled(Box)`
  && {
    width: 100%;
    height: auto;
    border: 2px solid #6930c3;
    border-radius: 5px;
    text-align: center;
    font-weight: bold;
    font-size: 13px;
    color: #64dfdf;
  }
`;

const S = {
  YoutubeWrapper: styled.div`
      visibility: ${(p) => p.hidden && "hidden"};
  `,
};
