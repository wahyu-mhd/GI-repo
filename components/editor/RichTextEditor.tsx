'use client'

import { useState } from 'react'
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
import { editorTheme } from '@/components/editor/themes/editor-theme'
import { TooltipProvider } from '@/components/ui/tooltip'

const editorConfig: InitialConfigType = {
  namespace: 'Editor',
  theme: editorTheme,
  nodes: [HeadingNode, ParagraphNode, TextNode, QuoteNode],
  onError: (error: Error) => console.error(error),
}

type Props = {
  value?: string // serialized editor state JSON or HTML if you prefer
  onChange: (val: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder = 'Start typing...' }: Props) {
    const editorState = value && value.trim() ? value : undefined
  return (
    <div className="bg-background w-full overflow-hidden rounded-lg border">
      <LexicalComposer initialConfig={{ ...editorConfig, editorState}}>
        <TooltipProvider>
          <div className="relative">
            {/* <RichTextPlugin
              contentEditable={
                <div className="">
                  <ContentEditable
                    placeholder={placeholder}
                    className="ContentEditable__root relative block min-h-72 overflow-auto px-8 py-4 focus:outline-none"
                  />
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            /> */}
            <RichTextPlugin
                contentEditable={
                    <ContentEditable className="ContentEditable__root relative block min-h-[80px] overflow-auto px-3 py-2 focus:outline-none" />
                }
                placeholder={
                    <div className="absolute inset-x-0 top-2 px-8 text-sm text-muted-foreground">
                    Start typing...
                    </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
            />

            <OnChangePlugin
              onChange={editorState => {
                // serialize to JSON string
                onChange(JSON.stringify(editorState.toJSON()))
              }}
            />
            {/* TODO: add toolbar plugins here, if needed */}
          </div>
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
