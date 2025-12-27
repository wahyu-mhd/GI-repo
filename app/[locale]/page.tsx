import { getTranslations, setRequestLocale } from "next-intl/server"
import Image from "next/image"
import { Link } from "@/navigation"
import { BookOpen, Trophy, TrendingUp, GraduationCap, School, User, ArrowRight, CheckCircle2 } from "lucide-react"
import { readNews, type NewsItem } from "@/lib/newsFileStore"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const dynamic = 'force-dynamic'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Ensure the request locale is set so translations resolve correctly
  setRequestLocale(locale)

  // Bind translations explicitly to the current locale to avoid falling back to default
  const t = await getTranslations({ locale, namespace: 'home' })
  const newsT = await getTranslations({ locale, namespace: 'news' })
  const newsItems = (await readNews()).slice(0, 3)

  const features = [
    { icon: <BookOpen className="w-5 h-5 text-blue-600" />, title: t('features.learn.title'), desc: t('features.learn.desc') },
    { icon: <Trophy className="w-5 h-5 text-orange-500" />, title: t('features.practice.title'), desc: t('features.practice.desc') },
    { icon: <TrendingUp className="w-5 h-5 text-green-500" />, title: t('features.progress.title'), desc: t('features.progress.desc') },
  ]

  const levels = [
    { title: t('levels.elementary.title'), grades: t('levels.elementary.grades'), icon: <User /> },
    { title: t('levels.junior.title'), grades: t('levels.junior.grades'), icon: <School /> },
    { title: t('levels.senior.title'), grades: t('levels.senior.grades'), icon: <GraduationCap /> },
  ]

  return (
    <main className="min-h-screen bg-slate-50/50">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-24 space-y-32">
        {/* --- HERO SECTION --- */}
        <div className="grid gap-12 md:grid-cols-2 items-center">
          <div className="space-y-8">
            <Badge variant="secondary" className="px-4 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full">
              {t('heroBadge')}
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
              {t('heroTitle.line1')} <br />
              <span className="text-blue-600">{t('heroTitle.line2')}</span>
            </h1>

            <p className="text-slate-500 text-lg md:text-xl leading-relaxed max-w-lg">
              {t('heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Using Shadcn Button with asChild for Next.js Links */}
              <Button asChild size="lg" className="h-12 px-8 text-base shadow-lg shadow-blue-200/50">
                <Link href="/auth/login?as=student">
                  {t('cta.student')} <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                <Link href="/auth/login?as=teacher">
                  {t('cta.teacher')} <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500 pt-2">
              {/* <div className="flex -space-x-3">
                <Avatar className="border-2 border-white w-8 h-8">
                  <AvatarFallback>S1</AvatarFallback>
                </Avatar>
                <Avatar className="border-2 border-white w-8 h-8">
                  <AvatarFallback>S2</AvatarFallback>
                </Avatar>
                <Avatar className="border-2 border-white w-8 h-8">
                  <AvatarFallback>S3</AvatarFallback>
                </Avatar>
              </div> */}
              {/* <p>Join 10,000+ others</p> */}
            </div>
          </div>

          {/* Right Visual (Mock Dashboard using Shadcn Cards) */}
          <div className="relative hidden md:block px-4">
            {/* Background Blob */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />

            <Card className="relative shadow-2xl border-slate-200 rotate-2 hover:rotate-0 transition-all duration-500">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{t('dashboard.courseTitle')}</CardTitle>
                    <CardDescription>{t('dashboard.courseSubtitle')}</CardDescription>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{t('dashboard.progressLabel')}</span>
                    <span className="text-blue-600">{t('dashboard.progressValue')}</span>
                  </div>
                  {/* Shadcn Progress Component */}
                  <Progress value={75} className="h-2" />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm p-3 bg-green-50/50 text-green-700 rounded-lg border border-green-100">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">{t('dashboard.taskCompleted')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-500">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                    <span>{t('dashboard.taskPending')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* --- FEATURES SECTION --- */}
        <section className="space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">{t('features.title')}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((item) => (
              <FeatureCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                desc={item.desc}
              />
            ))}
          </div>
        </section>

        {/* --- NEWS / UPDATES --- */}
        <section className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">{newsT('title')}</h2>
              <p className="text-slate-500">{newsT('subtitle')}</p>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/news">{newsT('viewAll')}</Link>
            </Button>
          </div>

          {newsItems.length > 0 ? (
            <div className="grid gap-4">
              {newsItems.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{newsT('empty')}</p>
          )}
        </section>

        {/* --- SCHOOL LEVELS --- */}
        <section className="space-y-10">
          <h2 className="text-2xl font-bold tracking-tight">{t('levels.title')}</h2>

          <div className="grid gap-6 md:grid-cols-3">
            {levels.map((level) => (
              <LevelCard key={level.title} title={level.title} grades={level.grades} icon={level.icon} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

// --- REUSABLE COMPONENTS ---

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-slate-200">
      <CardHeader>
        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center mb-2 border border-slate-100">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  )
}

function LevelCard({ title, grades, icon }: { title: string; grades: string; icon: React.ReactNode }) {
  return (
    <Card className="flex flex-row items-center gap-4 p-6 hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-default">
      <div className="p-3 bg-white rounded-full shadow-sm text-slate-700 border">{icon}</div>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{grades}</p>
      </div>
    </Card>
  )
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
              <h3 className="text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
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

  if (/^https?:\/\//i.test(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className="block group">
        {cardContent}
      </a>
    )
  }

  return (
    <Link href={item.href} className="block group">
      {cardContent}
    </Link>
  )
}
