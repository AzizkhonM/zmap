import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const room = await prisma.vetoRoom.findFirst({
      where: {
        OR: [
          { team1Token: token },
          { team2Token: token },
          { spectatorToken: token },
        ],
      },
      select: {
        id: true,
        format: true,
        status: true,
        team1Name: true,
        team2Name: true,
        mapPool: true,
        vetoState: true,
        expiresAt: true,
        team1Token: true,
        team2Token: true,
        spectatorToken: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "ROOM_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (room.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "ROOM_EXPIRED" },
        { status: 410 }
      );
    }

    let role: "TEAM_1" | "TEAM_2" | "SPECTATOR";

    if (token === room.team1Token) {
      role = "TEAM_1";
    } else if (token === room.team2Token) {
      role = "TEAM_2";
    } else {
      role = "SPECTATOR";
    }

    return NextResponse.json({
      room: {
        id: room.id,
        format: room.format,
        status: room.status,
        team1Name: room.team1Name,
        team2Name: room.team2Name,
        mapPool: room.mapPool,
        vetoState: room.vetoState,
        expiresAt: room.expiresAt,
      },
      role,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}