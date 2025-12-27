import { promises as fs } from 'fs'
import path from 'path'

export type NewsItem = {
  id: string
  title: string
  excerpt: string
  image: string
  href?: string
  tag?: string
  date?: string
  content?: string
  createdAt: string
  updatedAt?: string
}

const newsPath = path.join(process.cwd(), 'data', 'news.json')

const defaultNews: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Curriculum refresh with new interactive practice sets',
    excerpt: 'We added adaptive drills across math and science to keep learners engaged at every level.',
    image: '/globe.svg',
    href: '/news/curriculum-refresh',
    tag: 'Announcement',
    date: 'Dec 12, 2025',
    content: '',
    createdAt: '2025-12-12T00:00:00.000Z',
  },
  {
    id: 'news-2',
    title: 'Parent insights dashboard now highlights weekly wins',
    excerpt: 'See streaks, milestones, and suggested next steps right from your home screen.',
    image: '/window.svg',
    href: '/news/parent-insights',
    tag: 'Product',
    date: 'Dec 8, 2025',
    content: '',
    createdAt: '2025-12-08T00:00:00.000Z',
  },
  {
    id: 'news-3',
    title: 'Teacher-led study groups launch for exam readiness',
    excerpt: 'Join live sessions hosted by top instructors and collaborate with classmates in real time.',
    image: '/file.svg',
    href: '/news/study-groups',
    content: '',
    date: 'Dec 2, 2025',
    createdAt: '2025-12-02T00:00:00.000Z',
  },
]

async function ensureFile(): Promise<void> {
  try {
    await fs.access(newsPath)
  } catch {
    await fs.mkdir(path.dirname(newsPath), { recursive: true })
    await fs.writeFile(newsPath, JSON.stringify(defaultNews, null, 2), 'utf8')
  }
}

async function readJson(): Promise<NewsItem[]> {
  try {
    await ensureFile()
    const raw = await fs.readFile(newsPath, 'utf8')
    const parsed = raw.trim() ? (JSON.parse(raw) as NewsItem[]) : []
    return parsed
  } catch (error) {
    console.error('readNews: falling back to default news', error)
    return [...defaultNews]
  }
}

async function writeJson(data: NewsItem[]): Promise<void> {
  await ensureFile()
  await fs.writeFile(newsPath, JSON.stringify(data, null, 2), 'utf8')
}

export async function readNews(): Promise<NewsItem[]> {
  const news = await readJson()
  return news.sort((a, b) => {
    const aDate = a.date ?? a.createdAt
    const bDate = b.date ?? b.createdAt
    return new Date(bDate ?? '').getTime() - new Date(aDate ?? '').getTime()
  })
}

export async function addNews(
  data: Omit<NewsItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<NewsItem> {
  const news = await readNews()
  const now = new Date().toISOString()
  const item: NewsItem = {
    id: `news-${Date.now()}-${news.length}`,
    createdAt: now,
    ...data,
  }
  await writeJson([...news, item])
  return item
}

export async function updateNews(
  id: string,
  patch: Partial<Omit<NewsItem, 'id' | 'createdAt'>>
): Promise<NewsItem | undefined> {
  const news = await readNews()
  let updated: NewsItem | undefined
  const next = news.map(item => {
    if (item.id !== id) return item
    updated = { ...item, ...patch, updatedAt: new Date().toISOString() }
    return updated
  })
  if (!updated) return undefined
  await writeJson(next)
  return updated
}

export async function deleteNews(id: string): Promise<boolean> {
  const news = await readNews()
  const exists = news.some(item => item.id === id)
  if (!exists) return false
  const next = news.filter(item => item.id !== id)
  await writeJson(next)
  return true
}

export async function getNewsById(id: string): Promise<NewsItem | undefined> {
  const news = await readNews()
  return news.find(item => item.id === id)
}
