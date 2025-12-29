import { getTranslations, setRequestLocale } from "next-intl/server"
import { readNews } from "@/lib/newsFileStore"
import { NewsList } from "@/components/news/NewsList"

export const dynamic = "force-dynamic"

export default async function NewsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "news" })
  const newsItems = await readNews()

  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16 space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
          <p className="text-slate-500">{t("subtitle")}</p>
        </div>

        {newsItems.length > 0 ? (
          <NewsList
            items={newsItems}
            sortLabel={t("sortLabel")}
            newestLabel={t("sortNewest")}
            oldestLabel={t("sortOldest")}
          />
        ) : (
          <p className="text-sm text-slate-500">{t("empty")}</p>
        )}
      </div>
    </main>
  )
}
