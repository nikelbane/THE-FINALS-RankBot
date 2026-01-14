interface RankEntry {
  rank: number;
  league: number;
  points: number;
  timestamp: string;
  leagueName: string;
}

interface Stats {
  id: string;
  rank: number;
  oldRank: number;
  league: number;
  oldLeague: number | null;
  points: number;
  rankChange: number;
  steamId: string | null;
  xboxId: string | null;
  psnId: string | null;
  clubTag: string | null;
  timestamp: string; // ISO 8601
  isLatest: boolean;
  leagueName: string;
  leagueIconUrl: string;
}

interface RoleMap {
  [key: string]: string;
}
