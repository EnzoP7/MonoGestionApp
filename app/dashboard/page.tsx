import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";

export default async function Page() {
  const userId = await getCurrentUserId();

  return (
    <div className="space-y-6 pb-8">
      <SectionCards userId={userId!} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive userId={userId!} />
      </div>
      <div className="px-4 lg:px-6">
        <DataTable userId={userId!} />
      </div>
    </div>
  );
}
