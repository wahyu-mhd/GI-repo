'use client'

import { useMemo, useRef, useState } from 'react'
import {
  LexicalComposer,
  InitialConfigType,
} from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ParagraphNode, TextNode } from 'lexical'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { HashtagNode } from '@lexical/hashtag'
import { TRANSFORMERS } from '@lexical/markdown'

import { editorTheme } from '@/components/editor/themes/editor-theme'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToolbarPlugin } from '@/components/editor/plugins/toolbar/toolbar-plugin'
import { HistoryToolbarPlugin } from '@/components/editor/plugins/toolbar/history-toolbar-plugin'
import { BlockFormatDropDown } from '@/components/editor/plugins/toolbar/block-format-toolbar-plugin'
import { FormatParagraph } from '@/components/editor/plugins/toolbar/block-format/format-paragraph'
import { FormatHeading } from '@/components/editor/plugins/toolbar/block-format/format-heading'
import { FormatQuote } from '@/components/editor/plugins/toolbar/block-format/format-quote'
import { FormatNumberedList } from '@/components/editor/plugins/toolbar/block-format/format-numbered-list'
import { FormatBulletedList } from '@/components/editor/plugins/toolbar/block-format/format-bulleted-list'
import { FormatCheckList } from '@/components/editor/plugins/toolbar/block-format/format-check-list'
import { FontSizeToolbarPlugin } from '@/components/editor/plugins/toolbar/font-size-toolbar-plugin'
import { FontFamilyToolbarPlugin } from '@/components/editor/plugins/toolbar/font-family-toolbar-plugin'
import { FontFormatToolbarPlugin } from '@/components/editor/plugins/toolbar/font-format-toolbar-plugin'
import { SubSuperToolbarPlugin } from '@/components/editor/plugins/toolbar/subsuper-toolbar-plugin'
import { FontColorToolbarPlugin } from '@/components/editor/plugins/toolbar/font-color-toolbar-plugin'
import { FontBackgroundToolbarPlugin } from '@/components/editor/plugins/toolbar/font-background-toolbar-plugin'
import { LinkToolbarPlugin } from '@/components/editor/plugins/toolbar/link-toolbar-plugin'
import { ElementFormatToolbarPlugin } from '@/components/editor/plugins/toolbar/element-format-toolbar-plugin'
import { LinkPlugin } from '@/components/editor/plugins/link-plugin'
import { AutoLinkPlugin } from '@/components/editor/plugins/auto-link-plugin'
import { FloatingLinkEditorPlugin } from '@/components/editor/plugins/floating-link-editor-plugin'
import { ImagesPlugin } from '@/components/editor/plugins/images-plugin'
import { InsertImage } from '@/components/editor/plugins/toolbar/block-insert/insert-image'
import { MarkdownTogglePlugin } from '@/components/editor/plugins/actions/markdown-toggle-plugin'
import { ActionsPlugin } from '@/components/editor/plugins/actions/actions-plugin'
import { ListMaxIndentLevelPlugin } from '@/components/editor/plugins/list-max-indent-level-plugin'
import { IMAGE as ImageMarkdownTransformer } from '@/components/editor/transformers/markdown-image-transformer'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ImageNode } from '@/components/editor/nodes/image-node'

type Props = {
  value?: string // serialized editor state JSON or HTML if you prefer
  onChange: (val: string) => void
  placeholder?: string
}

const editorNodes = [
  HeadingNode,
  ParagraphNode,
  TextNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  HashtagNode,
  LinkNode,
  AutoLinkNode,
  ImageNode,
]

const editorConfig: InitialConfigType = {
  namespace: 'Editor',
  theme: editorTheme,
  nodes: editorNodes,
  onError: (error: Error) => console.error(error),
}

export function RichTextEditor({ value, onChange, placeholder = 'Start typing...' }: Props) {
  const editorState = value && value.trim() ? value : undefined
  const anchorElem = useRef<HTMLDivElement | null>(null)
  const [isLinkEditMode, setIsLinkEditMode] = useState(false)

  const markdownTransformers = useMemo(
    () => [ImageMarkdownTransformer, ...TRANSFORMERS],
    []
  )

  return (
    <div ref={anchorElem} className="bg-background w-full overflow-hidden rounded-lg border">
      <LexicalComposer initialConfig={{ ...editorConfig, editorState }}>
        <TooltipProvider>
          <div className="flex flex-col gap-2">
            <ToolbarPlugin>
              {() => (
                <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2">
                  <HistoryToolbarPlugin />
                  <BlockFormatDropDown>
                    <FormatParagraph />
                    <FormatHeading levels={['h1', 'h2', 'h3']} />
                    <FormatQuote />
                    <FormatNumberedList />
                    <FormatBulletedList />
                    <FormatCheckList />
                  </BlockFormatDropDown>
                  <Separator orientation="vertical" className="!h-7" />
                  <FontSizeToolbarPlugin />
                  <FontFamilyToolbarPlugin />
                  <FontFormatToolbarPlugin />
                  <SubSuperToolbarPlugin />
                  <FontColorToolbarPlugin />
                  <FontBackgroundToolbarPlugin />
                  <LinkToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />
                  <ElementFormatToolbarPlugin separator={false} />
                  <Separator orientation="vertical" className="!h-7" />
                  <Select>
                    <SelectTrigger className="!h-8 w-[120px]">
                      <SelectValue placeholder="Insert" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <InsertImage />
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <ActionsPlugin>
                    <MarkdownTogglePlugin
                      transformers={markdownTransformers}
                      shouldPreserveNewLinesInMarkdown={false}
                    />
                  </ActionsPlugin>
                </div>
              )}
            </ToolbarPlugin>

            <div className="relative">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable className="ContentEditable__root relative block min-h-[160px] overflow-auto px-3 py-2 focus:outline-none" />
                }
                placeholder={
                  <div className="pointer-events-none absolute inset-x-0 top-2 px-3 text-sm text-muted-foreground">
                    {placeholder}
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />

              <HistoryPlugin />
              <ListPlugin />
              <ListMaxIndentLevelPlugin maxDepth={5} />
              <LinkPlugin />
              <AutoLinkPlugin />
              <ImagesPlugin captionsEnabled />
              <FloatingLinkEditorPlugin
                anchorElem={anchorElem.current}
                isLinkEditMode={isLinkEditMode}
                setIsLinkEditMode={setIsLinkEditMode}
              />
              <MarkdownShortcutPlugin transformers={markdownTransformers} />
              <OnChangePlugin
                onChange={state => {
                  onChange(JSON.stringify(state.toJSON()))
                }}
              />
            </div>
          </div>
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
