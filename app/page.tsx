export const dynamic = "force-dynamic"
import { TableOfMR } from "@/components/TableOfMR"
import { getMRs } from "@/app/actions/get-mrs"

export default async function Home({
  searchParams,
}: {
  searchParams: {
    search?: string
    page?: string
  }
}) {
  const { page, search } = await searchParams;
  const findPage = Number(page ?? 1)

  const mrs = await getMRs({
    search: search ?? "",
    page: findPage,
    limit: 10,
  })

  return (
    <div className="flex p-10">
      <TableOfMR data={mrs} page={findPage} />
    </div>
  )
}
