import React from 'react'
import type { JSX } from 'react'

function lexicalJsonToPlainText(raw: string | undefined): string {
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw) as { root?: { children?: any[] } }
    const visit = (node: any): string => {
      if (!node) return ''
      if (typeof node.text === 'string') return node.text
      if (Array.isArray(node.children)) return node.children.map(visit).join('')
      return ''
    }
    const rootChildren = parsed.root?.children ?? []
    return rootChildren.map(visit).join('\n').trim()
  } catch {
    return raw
  }
}

function extractYouTubeIds(text: string): string[] {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/g
  const ids: string[] = []
  for (const match of text.matchAll(regex)) {
    if (match[1]) ids.push(match[1])
  }
  return Array.from(new Set(ids))
}

function extractDirectVideoUrls(text: string): string[] {
  const regex = /(https?:\/\/[^\s]+?\.(mp4|webm|ogg)(\?[^\s]*)?)/gi
  const urls: string[] = []
  for (const match of text.matchAll(regex)) {
    if (match[1]) urls.push(match[1])
  }
  return Array.from(new Set(urls))
}

function getMediaForUrl(url: string): JSX.Element | null {
  const ytMatch =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(
      url
    )
  if (ytMatch?.[1]) {
    const id = ytMatch[1]
    return (
      <div className="mt-2 aspect-video w-full overflow-hidden rounded-md border">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      </div>
    )
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return (
      <div className="mt-2 aspect-video w-full overflow-hidden rounded-md border bg-black/5">
        <video src={url} controls className="h-full w-full object-contain" />
      </div>
    )
  }

  if (/\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|$)/i.test(url)) {
    return (
      <div className="mt-2 w-full overflow-hidden rounded-md border bg-white">
        <img
          src={url}
          alt="Embedded image"
          className="h-auto w-full object-contain"
          loading="lazy"
        />
      </div>
    )
  }

  return null
}

function linkifyText(
  text: string,
  includeMedia = true
): { inline: Array<string | JSX.Element>; embeds: JSX.Element[] } {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts: Array<string | JSX.Element> = []
  const embeds: JSX.Element[] = []
  let lastIndex = 0

  for (const match of text.matchAll(urlRegex)) {
    const url = match[0]
    const start = match.index ?? 0
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start))
    }
    const media = includeMedia ? getMediaForUrl(url) : null
    parts.push(
      <a
        key={`${url}-${start}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 underline"
      >
        {url}
      </a>
    )
    if (media) {
      embeds.push(React.cloneElement(media, { key: `${url}-media-${start}` }))
    }
    lastIndex = start + url.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  const inline = parts.length ? parts : [text]
  return { inline, embeds }
}

type LexicalNode = {
  type: string
  format?: number
  text?: string
  children?: LexicalNode[]
  direction?: string | null
  indent?: number
  version?: number
  url?: string
  tag?: string
  listType?: 'number' | 'bullet' | 'check'
  checked?: boolean
}

type RenderOptions = {
  includeMedia?: boolean
}

// Minimal renderer to preserve basic formatting (bold/italic/underline) and links
function renderNodes(nodes: LexicalNode[] | undefined, options?: RenderOptions): React.ReactNode {
  if (!nodes) return null

  const includeMedia = options?.includeMedia !== false

  const collect = (
    node: LexicalNode,
    embeds: JSX.Element[],
    key: string,
    parentListType?: 'number' | 'bullet' | 'check'
  ): React.ReactNode => {
    const renderText = (textNode: LexicalNode) => {
      const format = textNode.format ?? 0
      const { inline, embeds: extraEmbeds } = linkifyText(textNode.text ?? '', includeMedia)
      embeds.push(...extraEmbeds)

      let content: React.ReactNode = inline
      if (format & 1) content = <strong>{content}</strong> // bold
      if (format & 2) content = <em>{content}</em> // italic
      if (format & 4) content = <u>{content}</u> // underline
      if (format & 8) content = <s>{content}</s> // strikethrough
      if (format & 16) content = <code>{content}</code> // code
      if (format & 32) content = <sub>{content}</sub> // subscript
      if (format & 64) content = <sup>{content}</sup> // superscript
      return content
    }

    switch (node.type) {
      case 'paragraph': {
        const childEmbeds: JSX.Element[] = []
        const children = (node.children ?? []).map((child, idx) =>
          collect(child, childEmbeds, `${key}-c${idx}`, parentListType)
        )
        return (
          <React.Fragment key={key}>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{children}</p>
            {childEmbeds}
          </React.Fragment>
        )
      }
      case 'heading': {
        const Tag = (node.tag || 'h3') as keyof JSX.IntrinsicElements
        const childEmbeds: JSX.Element[] = []
        const children = (node.children ?? []).map((child, idx) =>
          collect(child, childEmbeds, `${key}-c${idx}`, parentListType)
        )
        return (
          <React.Fragment key={key}>
            <Tag className="font-semibold">{children}</Tag>
            {childEmbeds}
          </React.Fragment>
        )
      }
      case 'quote': {
        const childEmbeds: JSX.Element[] = []
        const children = (node.children ?? []).map((child, idx) =>
          collect(child, childEmbeds, `${key}-c${idx}`, parentListType)
        )
        return (
          <React.Fragment key={key}>
            <blockquote className="border-l-2 pl-3 italic text-slate-700">
              {children}
            </blockquote>
            {childEmbeds}
          </React.Fragment>
        )
      }
      case 'list': {
        const ListTag = node.listType === 'number' ? 'ol' : 'ul'
        const children = (node.children ?? []).map((child, idx) =>
          collect(child, embeds, `${key}-c${idx}`, node.listType)
        )
        const listClass =
          node.listType === 'number'
            ? 'ml-5 list-inside list-decimal space-y-1 text-sm text-slate-700'
            : node.listType === 'check'
              ? 'ml-5 list-none space-y-1 text-sm text-slate-700'
              : 'ml-5 list-inside list-disc space-y-1 text-sm text-slate-700'
        return (
          <ListTag key={key} className={listClass}>
            {children}
          </ListTag>
        )
      }
      case 'listitem': {
        const childEmbeds: JSX.Element[] = []
        const children = (node.children ?? []).map((child, idx) =>
          collect(child, childEmbeds, `${key}-c${idx}`, parentListType)
        )
        if (parentListType === 'check') {
          const isChecked = Boolean(node.checked)
          return (
            <li key={key} className="flex items-start gap-2">
              <input
                type="checkbox"
                defaultChecked={isChecked}
                className="mt-1 h-4 w-4 rounded border border-slate-400 accent-blue-600"
              />
              <span className="flex-1">{[...children, ...childEmbeds]}</span>
            </li>
          )
        }
        return <li key={key}>{[...children, ...childEmbeds]}</li>
      }
      case 'link': {
        const childEmbeds: JSX.Element[] = []
        const children = (node.children ?? []).map((child, idx) =>
          collect(child, childEmbeds, `${key}-c${idx}`, parentListType)
        )
        embeds.push(...childEmbeds)
        return (
          <a
            key={key}
            href={node.url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {children}
          </a>
        )
      }
      case 'linebreak':
        return <br key={key} />
      case 'text':
        return <React.Fragment key={key}>{renderText(node)}</React.Fragment>
      default: {
        const childEmbeds: JSX.Element[] = []
        const children = (node.children ?? []).map((child, idx) =>
          collect(child, childEmbeds, `${key}-c${idx}`, parentListType)
        )
        embeds.push(...childEmbeds)
        return (
          <span key={key} className="text-sm text-slate-700">
            {children}
          </span>
        )
      }
    }
  }

  const embeds: JSX.Element[] = []
  const rendered = nodes.map((node, idx) => collect(node, embeds, `${node.type}-${idx}`))

  return (
    <>
      {rendered}
      {embeds}
    </>
  )
}

type Props = {
  content: string
  maxChars?: number // when provided, show a truncated preview without embeds
}

export function LessonContent({ content, maxChars }: Props) {
  const plain = lexicalJsonToPlainText(content)
  const paragraphs = (() => {
    try {
      const parsed = JSON.parse(content || '') as { root?: { children?: LexicalNode[] } }
      return parsed.root?.children ?? []
    } catch {
      // fallback to plain text paragraphs
      return (plain.split(/\n+/).filter(Boolean).map(line => ({
        type: 'paragraph',
        children: [{ type: 'text', text: line }],
      })) as LexicalNode[])
    }
  })()

  // Preview mode: render content without embeds and cap height for list cards
  if (typeof maxChars === 'number') {
    return (
      <div className="space-y-2">
        <div className="space-y-3 overflow-hidden max-h-48">
          {renderNodes(paragraphs as LexicalNode[], { includeMedia: false })}
        </div>
        {plain.length > maxChars && (
          <p className="text-xs text-slate-500">...truncated preview</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {renderNodes(paragraphs as LexicalNode[])}
    </div>
  )
}
