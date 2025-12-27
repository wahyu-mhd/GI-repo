import Image from "next/image"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/navigation"
import { readNews, type NewsItem } from "@/lib/newsFileStore"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

function isExternalLink(href?: string) {
  return Boolean(href && /^https?:\/\//i.test(href))
}

function NewsCard({ item }: { item: NewsItem }) {
  const cardContent = (
    <Card className="group hover:shadow-md transition-shadow duration-300 border-slate-200">
      <CardContent className="flex gap-4 p-4">
        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-slate-100 shrink-0">
          <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900 line-clamp-2">{item.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2">{item.excerpt}</p>
            </div>
            {item.tag && <Badge variant="secondary">{item.tag}</Badge>}
          </div>
          {item.date && <p className="text-xs text-slate-400">{item.date}</p>}
        </div>
      </CardContent>
    </Card>
  )

  if (!item.href) {
    return cardContent
  }

  if (isExternalLink(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className="block">
        {cardContent}
      </a>
    )
  }

  return (
    <Link href={item.href} className="block">
      {cardContent}
    </Link>
  )
}

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
          <div className="grid gap-4">
            {newsItems.map(item => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{t("empty")}</p>
        )}
      </div>
    </main>
  )
}
