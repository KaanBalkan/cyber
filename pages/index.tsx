import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import { RtmChannel } from "agora-rtm-sdk";
import {
  ICameraVideoTrack,
  IRemoteVideoTrack,
  IAgoraRTCClient,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";

type TCreateRoomResponse = {
  room: Room;
  rtcToken: string;
  rtmToken: string;
};

type TGetRandomRoomResponse = {
  rtcToken: string;
  rtmToken: string;
  rooms: Room[];
};

type Room = {
  _id: string;
  status: string;
};

type TMessage = {
  userId: string;
  message: string | undefined;
};

function createRoom(userId: string): Promise<TCreateRoomResponse> {
  return fetch(`/api/rooms?userId=${userId}`, {
    method: "POST",
  }).then((response) => response.json());
}

function getRandomRoom(userId: string): Promise<TGetRandomRoomResponse> {
  return fetch(`/api/rooms?userId=${userId}`).then((response) =>
    response.json()
  );
}

function setRoomToWaiting(roomId: string) {
  return fetch(`/api/rooms/${roomId}`, { method: "PUT" }).then((response) =>
    response.json()
  );
}

export const VideoPlayer = ({
  videoTrack,
  style,
}: {
  videoTrack: IRemoteVideoTrack | ICameraVideoTrack;
  style: object;
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const playerRef = ref.current;
    if (!videoTrack) return;
    if (!playerRef) return;

    videoTrack.play(playerRef);

    return () => {
      videoTrack.stop();
    };
  }, [videoTrack]);

  return <div ref={ref} style={style}></div>;
};

async function connectToAgoraRtc(
  roomId: string,
  userId: string,
  onVideoConnect: any,
  onWebcamStart: any,
  onAudioConnect: any,
  token: string
) {
  const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");

  const client = AgoraRTC.createClient({
    mode: "rtc",
    codec: "vp8",
  });

  await client.join(
    process.env.NEXT_PUBLIC_AGORA_APP_ID!,
    roomId,
    token,
    userId
  );

  client.on("user-left", async (user) => {
    console.log(`User left: ${user.uid}`);
    // Call function to set room status to waiting
    await setRoomToWaiting(roomId);
    // Optionally, you can also notify the remaining user or perform other cleanup actions here
  });

  client.on("user-published", (themUser, mediaType) => {
    client.subscribe(themUser, mediaType).then(() => {
      if (mediaType === "video") {
        onVideoConnect(themUser.videoTrack);
      }
      if (mediaType === "audio") {
        onAudioConnect(themUser.audioTrack);
        themUser.audioTrack?.play();
      }
    });
  });

  const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
  onWebcamStart(tracks[1]);
  await client.publish(tracks);

  return { tracks, client };
}

async function connectToAgoraRtm(
  roomId: string,
  userId: string,
  onMessage: (message: TMessage) => void,
  token: string
) {
  const { default: AgoraRTM } = await import("agora-rtm-sdk");
  const client = AgoraRTM.createInstance(process.env.NEXT_PUBLIC_AGORA_APP_ID!);
  await client.login({
    uid: userId,
    token,
  });
  const channel = await client.createChannel(roomId);
  await channel.join();
  channel.on("ChannelMessage", (message, userId) => {
    onMessage({
      userId,
      message: message.text,
    });
  });

  return {
    channel,
  };
}

export default function Home() {
  const [userId] = useState(parseInt(`${Math.random() * 1e6}`) + "");
  const [room, setRoom] = useState<Room | undefined>();
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [input, setInput] = useState("");
  const [themVideo, setThemVideo] = useState<IRemoteVideoTrack>();
  const [myVideo, setMyVideo] = useState<ICameraVideoTrack>();
  const [themAudio, setThemAudio] = useState<IRemoteAudioTrack>();
  const channelRef = useRef<RtmChannel>();
  const rtcClientRef = useRef<IAgoraRTCClient>();

  useEffect(() => {
    connectToARoom(); // Automatically start chatting when component mounts
  }, []); // Empty dependency array to run only once on mount

  function handleNextClick() {
    connectToARoom();
  }

  function handleStartChattingClicked() {
    connectToARoom();
  }

  async function handleSubmitMessage(e: React.FormEvent) {
    e.preventDefault();
    await channelRef.current?.sendMessage({
      text: input,
    });
    setMessages((cur) => [
      ...cur,
      {
        userId,
        message: input,
      },
    ]);
    setInput("");
  }

  async function connectToARoom() {
    setThemAudio(undefined);
    setThemVideo(undefined);
    setMyVideo(undefined);
    setMessages([]);

    let roomsResponse = await getRandomRoom(userId);
    let createRoomResponse;
    let roomToJoin;

    if (channelRef.current) {
      await channelRef.current.leave();
    }

    if (rtcClientRef.current) {
      rtcClientRef.current.leave();
    }

    if (roomsResponse.rooms.length > 0) {
      // Join the first waiting room available
      roomToJoin = roomsResponse.rooms[0];
    } else {
      // No waiting room available, create a new one
      createRoomResponse = await createRoom(userId); // Corrected this line
      roomToJoin = createRoomResponse.room;
    }    

    setRoom(roomToJoin);

    const rtmToken = roomsResponse.rooms.length > 0 ? roomsResponse.rtmToken : createRoomResponse.rtmToken;

    const { channel } = await connectToAgoraRtm(
      roomToJoin._id,
     userId,
     (message: TMessage) => setMessages((cur) => [...cur, message]),
      rtmToken
    );
    channelRef.current = channel;

    const { tracks, client } = await connectToAgoraRtc(
      roomToJoin._id,
      userId,
      (themVideo: IRemoteVideoTrack) => setThemVideo(themVideo),
      (myVideo: ICameraVideoTrack) => setMyVideo(myVideo),
      (themAudio: IRemoteAudioTrack) => setThemAudio(themAudio),
      roomsResponse.rtcToken || createRoomResponse.rtcToken
    );
    rtcClientRef.current = client;

    // Delay for 2-3 seconds to check for another user
    setTimeout(async () => {
      if (themVideo || themAudio) {
        // Another user detected, update room status to 'chatting'
        await setRoomStatus(roomToJoin._id, 'chatting');
        roomToJoin.status = 'chatting';
        setRoom(roomToJoin);
      } else {
        // No other user detected, remain in 'waiting' status
        await setRoomStatus(roomToJoin._id, 'waiting');
      }
    }, 2000); // 2 seconds delay
}

async function setRoomStatus(roomId, status) {
  // Function to update room status on server
  return fetch(`/api/rooms/${roomId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })
  .then(response => response.json()) // Ensure you handle the response
  .catch(error => console.error('Error updating room status:', error)); // Handle any errors
}

  function convertToYouThem(message: TMessage) {
    return message.userId === userId ? "You" : "Them";
  }

  const isChatting = room!!;

  return (
    <>
      <Head>
        <title>Cyber Mingle</title>
        <meta name="description" content="Meet with other personas!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {isChatting ? (
          <>
           
            <div className="chat-window">
              <div className="video-panel">
                <div className="video-stream">
                  {myVideo && (
                    <VideoPlayer
                      style={{ width: "100%", height: "100%" }}
                      videoTrack={myVideo}
                    />
                  )}
                </div>
                <div className="video-stream">
                  {themVideo && (
                    <VideoPlayer
                      style={{ width: "100%", height: "100%" }}
                      videoTrack={themVideo}
                    />
                  )}
                </div>
                
              </div>
              <button className="next-button" onClick={handleNextClick}>Next Button</button>
             room id: {room._id} status: {room.status}

            
            </div>
          </>
      ) : (
          <>
            <button onClick={handleStartChattingClicked}>Start Chatting</button>
          </>
        )}
      </main>
    </>
  );
}
