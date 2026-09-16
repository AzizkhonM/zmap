import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getOpponent,
  getVetoSequence,
  type Team,
  type Side,
  type VetoAction,
  type VetoState,
  type VetoActionType,
} from "@/lib/veto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    console.log("=== ACTION REQUEST START ===");

    const { token } = await params;

    console.log("TOKEN:", token);

    const body = await request.json();

    console.log("BODY:", body);

    const {
      map,
      action,
      team,
      startingSide,
    }: {
      map?: string;
      action?: VetoActionType;
      team?: Team;
      startingSide?: Side;
    } = body;

    console.log("PARSED:", {
      map,
      action,
      team,
      startingSide,
    });

    const room = await prisma.vetoRoom.findFirst({
      where: {
        OR: [{ team1Token: token }, { team2Token: token }],
      },
    });

    if (!room) {
      console.log("ROOM NOT FOUND:", token);

      return NextResponse.json({ error: "ROOM_NOT_FOUND" }, { status: 404 });
    }

    console.log("ROOM FOUND:", {
      id: room.id,
      format: room.format,
      status: room.status,
      currentState: room.vetoState,
    });

    if (room.status !== "ACTIVE") {
      return NextResponse.json({ error: "ROOM_NOT_ACTIVE" }, { status: 400 });
    }

    if (room.expiresAt < new Date()) {
      return NextResponse.json({ error: "ROOM_EXPIRED" }, { status: 410 });
    }

    const userTeam: Team = token === room.team1Token ? "TEAM_1" : "TEAM_2";

    const mapPool = room.mapPool as string[];

    const state: VetoState = room.vetoState
      ? (room.vetoState as unknown as VetoState)
      : {
          currentStep: 0,
          actions: [],
          completed: false,
          sideSelection: null,
        };

    /*
     * ---------------------------------------------------------
     * SIDE SELECTION
     * ---------------------------------------------------------
     *
     * Team that DID NOT pick the map chooses CT/T.
     */

    if (state.sideSelection) {
      const pending = state.sideSelection;

      if (userTeam !== pending.team) {
        return NextResponse.json({ error: "NOT_YOUR_TURN" }, { status: 403 });
      }

      if (startingSide !== "CT" && startingSide !== "T") {
        return NextResponse.json(
          { error: "INVALID_STARTING_SIDE" },
          { status: 400 }
        );
      }

      const actions = state.actions.map((item) =>
        item.map === pending.map && item.action === "pick"
          ? {
              ...item,
              startingSide,
            }
          : item
      );

      // Remaining maps
      const remainingMaps = mapPool.filter(
        (mapName) => !actions.some((item) => item.map === mapName)
      );

      const sequence = getVetoSequence(room.format);

      const isFinalPick =
        state.currentStep >= sequence.length && remainingMaps.length === 1;

      let finalActions = actions;
      let completed = false;

      if (isFinalPick) {
        finalActions = [
          ...actions,
          {
            action: "decider",
            map: remainingMaps[0],
            team: null,
          },
        ];

        completed = true;
      }

      const newState: VetoState = {
        ...state,
        actions: finalActions,
        completed,
        sideSelection: null,
      };

      await prisma.vetoRoom.update({
        where: { id: room.id },
        data: {
          vetoState: newState,
          ...(completed
            ? {
                status: "COMPLETED",
              }
            : {}),
        },
      });

      return NextResponse.json({
        success: true,
        state: newState,
        remainingMaps,
      });
    }

    /*
     * ---------------------------------------------------------
     * NORMAL VETO ACTION
     * ---------------------------------------------------------
     */

    if (!map || !action || !team) {
      return NextResponse.json(
        { error: "INVALID_ACTION_DATA" },
        { status: 400 }
      );
    }

    if (state.completed) {
      return NextResponse.json({ error: "VETO_COMPLETED" }, { status: 400 });
    }

    const sequence = getVetoSequence(room.format);
    const currentStep = sequence[state.currentStep];

    console.log("VETO DEBUG", {
      format: room.format,
      currentStep: state.currentStep,
      currentStepData: getVetoSequence(room.format)[state.currentStep],
      action,
      team,
      userTeam,
      map,
    });

    if (!currentStep) {
      return NextResponse.json({ error: "INVALID_VETO_STEP" }, { status: 400 });
    }

    if (action !== currentStep.action) {
      return NextResponse.json(
        {
          error: "INVALID_ACTION",
          debug: {
            receivedAction: action,
            expectedAction: currentStep.action,
            currentStep: state.currentStep,
            format: room.format,
          },
        },
        { status: 400 }
      );
    }

    if (userTeam !== currentStep.team) {
      return NextResponse.json({ error: "NOT_YOUR_TURN" }, { status: 403 });
    }

    if (!mapPool.includes(map)) {
      return NextResponse.json({ error: "INVALID_MAP" }, { status: 400 });
    }

    const alreadyUsed = state.actions.some((item) => item.map === map);

    if (alreadyUsed) {
      return NextResponse.json({ error: "MAP_ALREADY_USED" }, { status: 400 });
    }

    const expectedTeam: Team =
      state.currentStep % 2 === 0 ? "TEAM_1" : "TEAM_2";

    if (team !== expectedTeam || team !== userTeam) {
      return NextResponse.json({ error: "NOT_YOUR_TURN" }, { status: 403 });
    }

    /*
     * ---------------------------------------------------------
     * PICK
     * ---------------------------------------------------------
     */

    if (action === "pick") {
      const newAction: VetoAction = {
        action: "pick",
        map,
        team,
      };

      const newActions = [...state.actions, newAction];

      const opponent = getOpponent(team);

      const newState: VetoState = {
        ...state,
        currentStep: state.currentStep + 1,
        actions: newActions,
        sideSelection: {
          map,
          team: opponent,
        },
      };

      await prisma.vetoRoom.update({
        where: {
          id: room.id,
        },
        data: {
          vetoState: newState,
        },
      });

      return NextResponse.json({
        success: true,
        state: newState,
      });
    }

    /*
     * ---------------------------------------------------------
     * BAN
     * ---------------------------------------------------------
     */

    const newAction: VetoAction = {
      action: "ban",
      map,
      team,
    };

    const newActions = [...state.actions, newAction];

    const nextStep = state.currentStep + 1;

    const remainingMaps = mapPool.filter(
      (mapName) => !newActions.some((item) => item.map === mapName)
    );

    const shouldCreateDecider =
      remainingMaps.length === 1 && nextStep >= sequence.length;

    let finalActions = newActions;
    let isCompleted = false;

    if (shouldCreateDecider) {
      finalActions = [
        ...newActions,
        {
          action: "decider",
          map: remainingMaps[0],
          team: null,
        },
      ];

      isCompleted = true;
    }

    const newState: VetoState = {
      ...state,
      currentStep: nextStep,
      actions: finalActions,
      completed: isCompleted,
    };

    await prisma.vetoRoom.update({
      where: {
        id: room.id,
      },
      data: {
        vetoState: newState,
        ...(isCompleted
          ? {
              status: "COMPLETED",
            }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      state: newState,
      remainingMaps,
    });
  } catch (error) {
    console.error("ACTION ERROR:", error);

    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
