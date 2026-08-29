import { NextResponse } from "next/server";

import { TEAM_CATALOG } from "@/lib/teams";

export async function GET() {
  return NextResponse.json({
    teams: TEAM_CATALOG,
    count: TEAM_CATALOG.length,
  });
}
