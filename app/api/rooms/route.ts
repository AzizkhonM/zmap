import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

const VALID_FORMATS = ["BO1", "BO3", "BO5"] as const;

function generateToken() {
  return randomBytes(18).toString("base64url");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      format,
      team1Name,
      team2Name,
      mapPool,
    } = body;

    if (!VALID_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: "Invalid format" },
        { status: 400 }
      );
    }

    if (
      typeof team1Name !== "string" ||
      typeof team2Name !== "string" ||
      !team1Name.trim() ||
      !team2Name.trim()
    ) {
      return NextResponse.json(
        { error: "Team names are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(mapPool) || mapPool.length === 0) {
      return NextResponse.json(
        { error: "Map pool is required" },
        { status: 400 }
      );
    }

    const room = await prisma.vetoRoom.create({
      data: {
        format,
        team1Name: team1Name.trim(),
        team2Name: team2Name.trim(),

        mapPool,

        team1Token: generateToken(),
        team2Token: generateToken(),
        spectatorToken: generateToken(),

        expiresAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ),
      },
    });

    const baseUrl =
      process.env.APP_URL ||
      "http://localhost:3000";

    return NextResponse.json({
      roomId: room.id,

      links: {
        team1: `${baseUrl}/veto/${room.team1Token}`,
        team2: `${baseUrl}/veto/${room.team2Token}`,
        spectator: `${baseUrl}/veto/${room.spectatorToken}`,
      },
    });
  } catch (error) {
    console.error("CREATE_ROOM_ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create veto room" },
      { status: 500 }
    );
  }
}