"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getVetoSequence,
  type Team,
  type VetoAction,
  type VetoState,
} from "@/lib/veto";

import type { Role, Room, RoomResponse } from "@/lib/room";

const actionLabels = {
  ban: "BAN",
  pick: "PICK",
  decider: "DECIDER",
};

export default function VetoRoomPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<"CT" | "T" | null>(null);

  useEffect(() => {
    params.then(({ token }) => setToken(token));
  }, [params]);

  const loadRoom = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`/api/rooms/${token}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "SERVER_ERROR");
        return;
      }

      setData(result);
      setError(null);
    } catch {
      setError("SERVER_ERROR");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  // Other device's actions appear automatically.
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(loadRoom, 2000);

    return () => clearInterval(interval);
  }, [token, loadRoom]);

  async function handleAction(map: string, startingSide?: "CT" | "T") {
    if (!token || !data || acting) return;

    const state = data.room.vetoState ?? {
      currentStep: 0,
      actions: [],
      completed: false,
      sideSelection: null,
    };

    // SIDE SELECTION
    if (state.sideSelection) {
      if (!startingSide) return;

      setActing(true);

      console.log("SIDE SELECTION", {
        map: state.sideSelection.map,
        startingSide,
        team: data.role,
      });

      try {
        const response = await fetch(`/api/rooms/${token}/action`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            map: state.sideSelection.map,
            startingSide,
          }),
        });

        const result = await response.json();

        console.log("SIDE RESPONSE", {
          status: response.status,
          result,
        });

        if (!response.ok) {
          setError(result.error ?? "ACTION_FAILED");
          return;
        }

        setData((current) =>
          current
            ? {
                ...current,
                room: {
                  ...current.room,
                  vetoState: result.state,
                  status: result.state.completed
                    ? "COMPLETED"
                    : current.room.status,
                },
              }
            : current
        );

        setError(null);
      } catch {
        setError("SERVER_ERROR");
      } finally {
        setActing(false);
      }

      return;
    }

    // NORMAL VETO ACTION
    const sequence = getVetoSequence(data.room.format);
    const currentStep = sequence[state.currentStep];

    if (!currentStep) return;

    setActing(true);

    console.log("HANDLE ACTION", {
      map,
      action: currentStep.action,
      team: data.role,
      currentStep: state.currentStep,
    });

    try {
      const response = await fetch(`/api/rooms/${token}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          map,
          action: currentStep.action,
          team: data.role,
          startingSide,
        }),
      });

      const result = await response.json();

      console.log("ACTION RESPONSE", {
        status: response.status,
        result,
      });

      if (!response.ok) {
        setError(result.error ?? "ACTION_FAILED");
        return;
      }

      setData((current) =>
        current
          ? {
              ...current,
              room: {
                ...current.room,
                vetoState: result.state,
                status: result.state.completed
                  ? "COMPLETED"
                  : current.room.status,
              },
            }
          : current
      );

      setError(null);
    } catch {
      setError("SERVER_ERROR");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error && !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090B] text-white">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-zinc-600">
            ZMap
          </p>
          <h1 className="mt-3 text-3xl font-bold">Room unavailable</h1>
          <p className="mt-2 text-sm text-zinc-500">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { room, role } = data;

  const state: VetoState = room.vetoState ?? {
    currentStep: 0,
    actions: [],
    completed: false,
  };

  const sequence = getVetoSequence(room.format);

  const currentStep = sequence[state.currentStep];

  const currentAction = currentStep?.action ?? null;
  const currentTeam = currentStep?.team ?? null;

  const isSpectator = role === "SPECTATOR";
  const isMyTurn = !isSpectator && currentTeam === role;

  const sideSelection = state.sideSelection ?? null;

  const isSideSelectionTurn = !!sideSelection && role === sideSelection.team;

  const pickedMap = sideSelection?.map ?? null;

  const usedMaps = new Set(state.actions.map((item) => item.map));

  const remainingMaps = room.mapPool.filter((map) => !usedMaps.has(map));

  const currentTeamName =
    currentTeam === "TEAM_1" ? room.team1Name : room.team2Name;

  const roleName =
    role === "TEAM_1"
      ? room.team1Name
      : role === "TEAM_2"
      ? room.team2Name
      : "Spectator";

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <div className="mx-auto min-h-screen max-w-6xl px-5 py-6 md:px-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-zinc-900 pb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
              ZMap
            </div>

            <div className="mt-2 flex items-center gap-3 text-sm text-zinc-500">
              <span>{room.format}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-700" />
              <span>{roleName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-xs font-medium text-zinc-400">
              {room.status}
            </span>
          </div>
        </header>

        {/* Teams */}
        <section className="py-10 text-center">
          <div className="flex items-center justify-center gap-5 md:gap-10">
            <TeamName name={room.team1Name} active={currentTeam === "TEAM_1"} />

            <span className="text-sm font-bold text-zinc-700">VS</span>

            <TeamName name={room.team2Name} active={currentTeam === "TEAM_2"} />
          </div>

          {!state.completed && (
            <div className="mt-8">
              {isSideSelectionTurn ? (
                <>
                  <p className="text-xs uppercase tracking-[0.25em] text-orange-500">
                    Side selection
                  </p>

                  <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                    Choose starting side
                  </h1>

                  <p className="mt-2 text-sm text-zinc-600">
                    {pickedMap} was picked by the opponent
                  </p>

                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      disabled={acting}
                      onClick={() => {
                        if (!pickedMap) return;

                        handleAction(pickedMap, "CT");
                      }}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 px-8 py-4 text-sm font-bold transition hover:border-orange-500 hover:bg-zinc-900 disabled:opacity-40"
                    >
                      CT
                    </button>

                    <button
                      disabled={acting}
                      onClick={() => {
                        if (!pickedMap) return;

                        handleAction(pickedMap, "T");
                      }}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 px-8 py-4 text-sm font-bold transition hover:border-orange-500 hover:bg-zinc-900 disabled:opacity-40"
                    >
                      T
                    </button>
                  </div>
                </>
              ) : currentAction ? (
                <>
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
                    {isSpectator
                      ? `${currentTeamName}'s turn`
                      : isMyTurn
                      ? "Your turn"
                      : `${currentTeamName}'s turn`}
                  </p>

                  <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                    {actionLabels[currentAction]}
                  </h1>
                </>
              ) : null}
            </div>
          )}

          {state.completed && (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.25em] text-orange-500">
                Veto completed
              </p>

              <h1 className="mt-2 text-3xl font-black">Maps are ready</h1>
            </div>
          )}

          {state.actions.find((item) => item.action === "decider") && (
            <div className="mx-auto mt-5 w-fit rounded-xl border border-orange-500/30 bg-orange-500/5 px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-500">
                Decider
              </p>

              <p className="mt-1 text-xl font-black">
                {state.actions.find((item) => item.action === "decider")?.map}
              </p>
            </div>
          )}
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Map grid */}
        <section>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {room.mapPool.map((map) => {
              const used = usedMaps.has(map);
              const disabled =
                used ||
                state.completed ||
                isSpectator ||
                sideSelection !== null ||
                !isMyTurn ||
                acting;

              const mapAction = state.actions.find((item) => item.map === map);

              return (
                <button
                  key={map}
                  disabled={disabled}
                  onClick={() => handleAction(map)}
                  className={[
                    "group relative aspect-[16/9] overflow-hidden rounded-xl border text-left transition",
                    used
                      ? "cursor-default border-zinc-900 bg-zinc-950 opacity-40"
                      : disabled
                      ? "cursor-not-allowed border-zinc-900 bg-zinc-950"
                      : "border-zinc-800 bg-zinc-950 hover:-translate-y-0.5 hover:border-orange-500 hover:bg-zinc-900",
                  ].join(" ")}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="text-base font-bold">{map}</div>

                    {mapAction && (
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-orange-500">
                        {mapAction.action}
                        {mapAction.team
                          ? ` · ${
                              mapAction.team === "TEAM_1"
                                ? room.team1Name
                                : room.team2Name
                            }`
                          : ""}
                      </div>
                    )}
                  </div>

                  {used && (
                    <div className="absolute right-3 top-3 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Used
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* History */}
        {state.actions.length > 0 && (
          <section className="mt-10 border-t border-zinc-900 pt-8">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
              Veto history
            </h2>

            <div className="space-y-2">
              {state.actions.map((item, index) => {
                const teamName =
                  item.team === "TEAM_1"
                    ? room.team1Name
                    : item.team === "TEAM_2"
                    ? room.team2Name
                    : null;

                const sideTeam =
                  item.team === "TEAM_1"
                    ? room.team2Name
                    : item.team === "TEAM_2"
                    ? room.team1Name
                    : null;

                return (
                  <div
                    key={`${item.map}-${index}`}
                    className="rounded-lg border border-zinc-900 bg-zinc-950 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-700">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="text-sm font-medium">{item.map}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {item.action === "decider" ? (
                          <span className="font-bold uppercase text-orange-500">
                            Decider
                          </span>
                        ) : (
                          <>
                            <span className="text-zinc-600">{teamName}</span>

                            <span className="font-bold uppercase text-orange-500">
                              {item.action}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {item.action === "pick" && item.startingSide && (
                      <div className="mt-2 ml-8 flex justify-end items-center gap-2 text-xs">
                        <span className="text-zinc-700">{sideTeam}</span>

                        <span className="text-zinc-500">→</span>

                        <span className="font-bold text-zinc-400">
                          {item.startingSide}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function TeamName({ name, active }: { name: string; active: boolean }) {
  return (
    <div
      className={[
        "min-w-0 max-w-[180px] truncate text-xl font-black md:max-w-[280px] md:text-3xl",
        active ? "text-white" : "text-zinc-700",
      ].join(" ")}
    >
      {name}
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090B] text-white">
      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          ZMap
        </div>

        <div className="mt-4 text-sm text-zinc-600">Loading veto room...</div>
      </div>
    </main>
  );
}
