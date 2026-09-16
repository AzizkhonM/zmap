"use client";

import { useState } from "react";
import { ArrowRight, Check, ChevronDown, Copy } from "lucide-react";
import Image from "next/image";

type MapDefinition = {
  id: string;
  name: string;
  image: string;
  active: boolean;
};

const maps: MapDefinition[] = [
  {
    id: "ancient",
    name: "Ancient",
    image: "/maps/ancient.webp",
    active: true,
  },
  {
    id: "anubis",
    name: "Anubis",
    image: "/maps/anubis.webp",
    active: true,
  },
  {
    id: "cache",
    name: "Cache",
    image: "/maps/cache.webp",
    active: true,
  },
  {
    id: "dust2",
    name: "Dust II",
    image: "/maps/dust2.webp",
    active: true,
  },
  {
    id: "inferno",
    name: "Inferno",
    image: "/maps/inferno.webp",
    active: true,
  },
  {
    id: "mirage",
    name: "Mirage",
    image: "/maps/mirage.webp",
    active: true,
  },
  {
    id: "nuke",
    name: "Nuke",
    image: "/maps/nuke.webp",
    active: true,
  },

  // Future maps:
  {
    id: "overpass",
    name: "Overpass",
    image: "/maps/overpass.webp",
    active: false,
  },
  {
    id: "vertigo",
    name: "Vertigo",
    image: "/maps/vertigo.webp",
    active: false,
  },
  {
    id: "train",
    name: "Train",
    image: "/maps/train.webp",
    active: false,
  },
  {
    id: "office",
    name: "Office",
    image: "/maps/office.webp",
    active: false,
  },
  {
    id: "italy",
    name: "Italy",
    image: "/maps/italy.webp",
    active: false,
  },
];

const formats = ["BO1", "BO3", "BO5"] as const;

export default function HomePage() {
  const [format, setFormat] = useState<(typeof formats)[number]>("BO3");

  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");

  type RoomLinks = {
    team1: string;
    team2: string;
    spectator: string;
  };

  type MapPoolMode = "ACTIVE" | "CUSTOM";

  const [mapPoolMode, setMapPoolMode] = useState<MapPoolMode>("ACTIVE");

  const [selectedMaps, setSelectedMaps] = useState<string[]>(
    maps.filter((map) => map.active).map((map) => map.id)
  );

  const [roomLinks, setRoomLinks] = useState<RoomLinks | null>(null);

  const [showRoomModal, setShowRoomModal] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

  function toggleMap(id: string) {
    if (mapPoolMode === "ACTIVE") return;

    setSelectedMaps((current) => {
      if (current.includes(id)) {
        return current.filter((mapId) => mapId !== id);
      }

      if (current.length >= 7) {
        return current;
      }

      return [...current, id];
    });
  }

  async function createRoom() {
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        format,
        team1Name: team1.trim(),
        team2Name: team2.trim(),
        mapPool: selectedMaps,
        mapPoolMode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data.error);
      return;
    }

    setRoomLinks(data.links);
    setShowRoomModal(true);
  }

  async function copyLink(type: keyof RoomLinks) {
    if (!roomLinks) return;

    await navigator.clipboard.writeText(roomLinks[type]);

    setCopied(type);

    setTimeout(() => {
      setCopied(null);
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:px-8">
        {/* Header */}
        <header className="mb-16 flex items-center justify-between">
          <div className="text-2xl font-semibold tracking-[-0.03em] text-white">
            ZMap
          </div>

          <div className="text-sm text-zinc-400">CS2 Map Veto</div>
        </header>

        {/* Hero */}
        <section className="mb-12">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-orange-500">
            CS2 Map Veto
          </p>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Set up your map veto.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">
            Select the map pool and match format. ZMap will generate dedicated
            links for both teams and spectators.
          </p>
        </section>

        {/* Teams */}
        <section className="mb-10 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Team 1
            </label>

            <input
              value={team1}
              onChange={(e) => setTeam1(e.target.value)}
              placeholder="Enter team name"
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Team 2
            </label>

            <input
              value={team2}
              onChange={(e) => setTeam2(e.target.value)}
              placeholder="Enter team name"
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
            />
          </div>
        </section>

        {/* Format */}
        <section className="mb-10">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-zinc-200">
              Match format
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Choose the series format.
            </p>
          </div>

          <div className="flex gap-2">
            {formats.map((item) => (
              <button
                key={item}
                onClick={() => setFormat(item)}
                className={`rounded-xl border px-6 py-3 text-sm font-semibold transition ${
                  format === item
                    ? "border-orange-500 bg-orange-500 text-black"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* Map Pool */}
        <section className="mb-12">
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200">Map pool</h2>

              <span className="text-xs text-zinc-600">
                {selectedMaps.length} selected
              </span>
            </div>

            <p className="mt-1 text-sm text-zinc-400">
              Select the maps available for this veto.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setMapPoolMode("ACTIVE");
                  setSelectedMaps(
                    maps.filter((map) => map.active).map((map) => map.id)
                  );
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  mapPoolMode === "ACTIVE"
                    ? "border-orange-500 bg-orange-500/10 text-orange-500"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                Current Active Pool
              </button>

              <button
                type="button"
                onClick={() => setMapPoolMode("CUSTOM")}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  mapPoolMode === "CUSTOM"
                    ? "border-orange-500 bg-orange-500/10 text-orange-500"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                Custom Map Pool
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {maps.map((map) => {
              const selected = selectedMaps.includes(map.id);

              return (
                <button
                  key={map.id}
                  type="button"
                  disabled={
                    mapPoolMode === "ACTIVE" ||
                    (!selected && selectedMaps.length >= 7)
                  }
                  onClick={() => toggleMap(map.id)}
                  className={`group relative aspect-[16/10] overflow-hidden rounded-xl border text-left transition ${
                    selected
                      ? "border-orange-500"
                      : "border-zinc-800 opacity-50 hover:opacity-80"
                  } ${
                    mapPoolMode === "ACTIVE"
                      ? "cursor-not-allowed"
                      : "disabled:cursor-not-allowed"
                  }`}
                >
                  <Image
                    src={map.image}
                    alt={map.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-3">
                    <span className="text-sm font-semibold">{map.name}</span>

                    {selected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-black">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Continue */}
        <section className="mt-auto flex flex-col gap-4 border-t border-zinc-900 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-400">
            {format} · {selectedMaps.length} maps
          </div>

          <button
            onClick={createRoom}
            disabled={
              !team1.trim() || !team2.trim() || selectedMaps.length !== 7
            }
            className="group flex h-12 items-center justify-center gap-3 rounded-xl bg-orange-500 px-6 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Create Veto Room
            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </section>
      </div>

      {showRoomModal && roomLinks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Room created</h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Share these links with the teams.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRoomModal(false)}
                className="text-2xl leading-none text-zinc-600 transition hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {(
                [
                  ["team1", "TEAM 1"],
                  ["team2", "TEAM 2"],
                  ["spectator", "SPECTATOR"],
                ] as const
              ).map(([type, label]) => (
                <div key={type}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                    {label}
                  </p>

                  <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-2">
                    <input
                      value={roomLinks[type]}
                      readOnly
                      className="min-w-0 flex-1 bg-transparent px-2 text-xs text-zinc-400 outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => copyLink(type)}
                      className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-orange-500 hover:text-orange-500"
                    >
                      {copied === type ? (
                        <>
                          <Check size={14} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowRoomModal(false)}
              className="mt-6 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
