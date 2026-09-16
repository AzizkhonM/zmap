import type { VetoFormat, VetoState } from "@/lib/veto";

export type RoomStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "EXPIRED";

export type Role =
  | "TEAM_1"
  | "TEAM_2"
  | "SPECTATOR";

export type Room = {
  id: string;
  format: VetoFormat;
  status: RoomStatus;
  team1Name: string;
  team2Name: string;
  mapPool: string[];
  vetoState: VetoState | null;
  expiresAt: string;
};

export type RoomResponse = {
  room: Room;
  role: Role;
};