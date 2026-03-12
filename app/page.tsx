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
  const page = Number(await searchParams.page ?? 1)

  const mrs = await getMRs({
    search: searchParams.search ?? "",
    page,
    limit: 10,
  })

  return (
    <div className="flex p-10">
      <TableOfMR data={mrs} page={page} />
    </div>
  )
}
