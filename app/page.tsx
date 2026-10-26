export const dynamic = "force-dynamic"
import { MrDirectory } from "@/components/MrDirectory"
import { DayStatus } from "@/components/DayStatus"
import { ViewTabs } from "@/components/ViewTabs"
import { TodayVisits } from "@/components/TodayVisits"
import { getMRs, getTodayVisits } from "@/app/actions/get-mrs"
import { formatTimeIST, todayIST } from "@/lib/visit-rules"

const PAGE_SIZE = 10

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    page?: string
    view?: string
  }>
}) {
  const { page, search, view } = await searchParams;
  const findPage = Math.max(1, Number(page) || 1)
  const showToday = view === "today"

  const today = todayIST()

  const [todayVisits, mrs] = await Promise.all([
    getTodayVisits(today),
    showToday
      ? null
      : getMRs({
          search: search ?? "",
          page: findPage,
          limit: PAGE_SIZE,
        }),
  ])

  return (
    <div className="space-y-4">
      <DayStatus today={today} count={todayVisits.length} />

      <ViewTabs active={showToday ? "today" : "all"} todayCount={todayVisits.length} />

      {mrs ? (
        <MrDirectory
          rows={mrs.rows}
          total={mrs.total}
          page={findPage}
          pageSize={PAGE_SIZE}
          today={today}
          todayCount={todayVisits.length}
        />
      ) : (
        <TodayVisits
          today={today}
          visits={todayVisits.map((v) => ({
            id: v.id,
            type: v.type,
            time: v.createdAt ? formatTimeIST(v.createdAt) : "",
            name: v.name,
            company: v.company,
            division: v.division,
          }))}
        />
      )}
    </div>
  )
}
