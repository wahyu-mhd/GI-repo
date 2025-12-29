'use client'

import {useMemo, useState} from 'react'
import type {NewsItem} from '@/lib/newsFileStore'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent} from '@/components/ui/card'
import Image from 'next/image'
import {Link} from '@/navigation'

type Props = {
  items: NewsItem[]
  sortLabel: string
  newestLabel: string
  oldestLabel: string
}

type SortOrder = 'newest' | 'oldest'

function isExternalLink(href?: string) {
  return Boolean(href && /^https?:\/\//i.test(href))
}

function getTimestamp(item: NewsItem) {
  const raw = item.date ?? item.createdAt ?? ''
  const ts = Date.parse(raw)
  return Number.isNaN(ts) ? 0 : ts
}

function NewsCard({item}: {item: NewsItem}) {
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

export function NewsList({items, sortLabel, newestLabel, oldestLabel}: Props) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  const sortedItems = useMemo(() => {
    const next = [...items]
    next.sort((a, b) => {
      const diff = getTimestamp(b) - getTimestamp(a)
      return sortOrder === 'newest' ? diff : -diff
    })
    return next
  }, [items, sortOrder])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
        <span>{sortLabel}</span>
        <select
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
          value={sortOrder}
          onChange={event => setSortOrder(event.target.value as SortOrder)}
        >
          <option value="newest">{newestLabel}</option>
          <option value="oldest">{oldestLabel}</option>
        </select>
      </div>

      <div className="grid gap-4">
        {sortedItems.map(item => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
