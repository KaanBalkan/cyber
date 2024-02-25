// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../../libs/dbConnect";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import { RtmTokenBuilder, RtmRole } from "agora-access-token";
import Room from "../../../models/Room";

const MAX_USERS = 2;

type Room = {
  status: String;
};

type ResponseData = Room[] | string;

function getRtmToken(userId: string) {
  const appID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const appCertificate = process.env.AGORA_APP_CERT!;
  const account = userId;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  const token = RtmTokenBuilder.buildToken(
    appID,
    appCertificate,
    account,
    RtmRole.Rtm_User,
    privilegeExpiredTs
  );
  return token;
}

function getRtcToken(roomId: string, userId: string) {
  const appID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const appCertificate = process.env.AGORA_APP_CERT!;
  const channelName = roomId;
  const account = userId;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithAccount(
    appID,
    appCertificate,
    channelName,
    account,
    role,
    privilegeExpiredTs
  );

  return token;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { method, query } = req;
  const userId = query.userId as string;

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        const rooms = await Room.aggregate([
          { $match: { status: "waiting" } },
          { $sample: { size: 1 } },
        ]);
        if (rooms.length > 0) {
          const roomId = rooms[0]._id.toString();
          await Room.findByIdAndUpdate(roomId, {
            status: "chatting",
          });
          res.status(200).json({
            rooms,
            rtcToken: getRtcToken(roomId, userId),
            rtmToken: getRtmToken(userId),
          });
        } else {
          res.status(200).json({ rooms: [], token: null });
        }
      } catch (error) {
        res.status(400).json((error as any).message);
      }
      break;
      case "POST":
  if (req.url?.endsWith("/leave")) {
    // Logic for handling leave request
    try {
      const roomId = req.body.roomId; // Assuming the room ID is passed in the request body
      const room = await Room.findById(roomId);
      if (room) {
        room.activeUsers -= 1;
        if (room.activeUsers === 0) {
          room.status = "empty"; // Update the status if the room is empty
        }
        await room.save();

        res.status(200).json({ message: "Left the room successfully" });
      } else {
        res.status(404).json("Room not found");
      }
    } catch (error) {
      res.status(500).json((error as any).message);
    }
  } else {
    // Handle creating a new room or joining an existing one
    try {
      let room = await Room.findOne({ status: "waiting" });
      if (!room) {
        room = await Room.create({
          status: "waiting",
          activeUsers: 1 // New room with 1 active user
        });
      } else {
        // Check if the room is not full
        if (room.activeUsers < MAX_USERS) {
          room.activeUsers += 1;
          await room.save();
        } else {
          // Create a new room if the existing one is full
          room = await Room.create({
            status: "waiting",
            activeUsers: 1
          });
        }
      }

      // Generate tokens for RTC and RTM
      const rtcToken = getRtcToken(room._id.toString(), userId);
      const rtmToken = getRtmToken(userId);

      res.status(200).json({
        room: room,
        rtcToken: rtcToken,
        rtmToken: rtmToken
      });
    } catch (error) {
      res.status(500).json((error as any).message);
    }
  }
  break;

// ... (other cases if any) ...

default:
  res.status(400).json("no method for this endpoint");
  break;
}
}
