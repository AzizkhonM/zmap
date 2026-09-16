export type VetoFormat = "BO1" | "BO3" | "BO5";

export type Team = "TEAM_1" | "TEAM_2";

export type Side = "CT" | "T";

export type VetoActionType = "ban" | "pick";

export type VetoAction = {
  action: VetoActionType | "decider";
  map: string;
  team: Team | null;
  startingSide?: Side;
};

export type VetoState = {
  currentStep: number;
  actions: VetoAction[];
  completed: boolean;
  sideSelection?: {
    map: string;
    team: Team;
  } | null;
};

export type VetoStep = {
  action: VetoActionType;
  team: Team;
};

export function getVetoSequence(format: VetoFormat): VetoStep[] {
  switch (format) {
    case "BO1":
      return [
        { action: "ban", team: "TEAM_1" },
        { action: "ban", team: "TEAM_2" },
        { action: "ban", team: "TEAM_1" },
        { action: "ban", team: "TEAM_2" },
        { action: "ban", team: "TEAM_1" },
        { action: "ban", team: "TEAM_2" },
      ];

    case "BO3":
      return [
        { action: "ban", team: "TEAM_1" },
        { action: "ban", team: "TEAM_2" },
        { action: "pick", team: "TEAM_1" },
        { action: "pick", team: "TEAM_2" },
        { action: "ban", team: "TEAM_1" },
        { action: "ban", team: "TEAM_2" },
      ];

    case "BO5":
      return [
        { action: "ban", team: "TEAM_1" },
        { action: "ban", team: "TEAM_2" },
        { action: "pick", team: "TEAM_1" },
        { action: "pick", team: "TEAM_2" },
        { action: "pick", team: "TEAM_1" },
        { action: "pick", team: "TEAM_2" },
      ];
  }
}

export function getOpponent(team: Team): Team {
  return team === "TEAM_1" ? "TEAM_2" : "TEAM_1";
}