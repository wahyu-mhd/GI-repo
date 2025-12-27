import Image from "next/image"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/navigation"
import { readNews } from "@/lib/newsFileStore"
import { Badge } from "@/components/ui/badge"
import { LessonContent } from "@/components/lesson/LessonContent"

export const dynamic = "force-dynamic"

function findNewsItem(items: Awaited<ReturnType<typeof readNews>>, slug: string) {
  return items.find(item => {
    if (item.id === slug) return true
    if (!item.href) return false
    return item.href === `/news/${slug}` || item.href.endsWith(`/news/${slug}`)
  })
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; newsId: string }>
}) {
  const { locale, newsId } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "news" })

  const items = await readNews()
  const item = findNewsItem(items, newsId)

  if (!item) notFound()

  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-8">
        <Link href="/news" className="text-sm text-blue-600 hover:underline">
          {t("back")}
        </Link>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {item.tag && <Badge variant="secondary">{item.tag}</Badge>}
            {item.date && <span className="text-xs text-slate-500">{item.date}</span>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{item.title}</h1>
          <p className="text-slate-500">{item.excerpt}</p>
        </div>

        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden bg-slate-100">
          <Image src={item.image} alt={item.title} fill className="object-cover" />
        </div>

        <div className="rounded-lg border bg-white p-6">
          {item.content ? (
            <LessonContent content={item.content} />
          ) : (
            <p className="text-sm text-slate-500">{t("noContent")}</p>
          )}
        </div>
      </div>
    </main>
  )
}
