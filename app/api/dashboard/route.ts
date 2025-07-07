// app/api/dashboard/route.ts
import { getUserDashboardData } from "@/lib/dashboard/dashboard";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { NextResponse } from "next/server";

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getUserDashboardData(userId);

  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache",
    },
  });
}
