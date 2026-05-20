// TextVizEditor.tsx
// React + CodeMirror 6 実装（制御文字表示切替 / 空白の可視化+ハイライト / 設定保存）
import React, { useEffect, useRef, useState } from 'react';

import { SettingOutlined } from '@ant-design/icons';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  insertNewline,
  insertNewlineAndIndent,
} from '@codemirror/commands';
import { indentOnInput } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState, StateEffect } from '@codemirror/state';
import {
  Command,
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
  drawSelection,
  highlightActiveLine,
  keymap,
  lineNumbers,
  placeholder,
} from '@codemirror/view';
import { Button, Popover, Typography } from 'antd';

const { Text } = Typography;

// ====== 設定 ======
const STORAGE_KEY = 'text_viz_editor_settings';

type ControlCharFormat = 'caret' | 'unicode';

type Props = {
  value: string;
  onChange?: (next: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  lineWrapping?: boolean;
  scrollable?: boolean;
  readOnly?: boolean;
};

type VizOptions = {
  showWhitespace: boolean;
  whitespaceSpaces: boolean;
  whitespaceTabs: boolean;
  showControlChars: boolean;
  controlCharFormat: ControlCharFormat;
  indentWithTab: boolean;
  autoIndent: boolean;
};

const defaultVizOptions: VizOptions = {
  showWhitespace: true,
  whitespaceSpaces: false,
  whitespaceTabs: true,
  showControlChars: true,
  controlCharFormat: 'caret',
  indentWithTab: true,
  autoIndent: true,
};

function isAsciiControl(ch: number) {
  return (ch >= 0x00 && ch <= 0x1f) || ch === 0x7f;
}

function caretNotation(ch: number) {
  if (ch === 0x7f) return '^?';
  const code = ch + 0x40;
  return '^' + String.fromCharCode(code);
}

function unicodeNotation(ch: number) {
  return 'U+' + ch.toString(16).toUpperCase().padStart(4, '0');
}

const insertTabChar: Command = ({ state, dispatch }) => {
  if (state.readOnly) return false;
  dispatch(
    state.update(state.replaceSelection('\t'), {
      scrollIntoView: true,
      userEvent: 'input.insert',
    })
  );
  return true;
};

// ====== 空白可視化用 Widget ======
class WhitespaceWidget extends WidgetType {
  constructor(
    private kind: 'space' | 'tab',
    private text: string
  ) {
    super();
  }
  eq(other: WhitespaceWidget) {
    return this.kind === other.kind && this.text === other.text;
  }
  toDOM() {
    const span = document.createElement('span');
    span.className = this.kind === 'space' ? 'cm-ws-symbol cm-ws-space' : 'cm-ws-symbol cm-ws-tab';
    span.textContent = this.text;
    span.setAttribute('aria-hidden', 'true');
    return span;
  }
  ignoreEvent() {
    return true;
  }
}

// ====== 制御文字可視化用 Widget ======
class ControlCharWidget extends WidgetType {
  constructor(private label: string) {
    super();
  }
  eq(other: ControlCharWidget) {
    return this.label === other.label;
  }
  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-ctrlchar';
    span.textContent = this.label;
    span.setAttribute('aria-hidden', 'true');
    return span;
  }
  ignoreEvent() {
    return true;
  }
}

const vizCompartment = new Compartment();
const behaviorCompartment = new Compartment();
const setVizOptionsEffect = StateEffect.define<VizOptions>();

function buildVizPlugin(options: VizOptions) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = this.build(view);
      }
      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.transactions.some((t) => t.effects.some((e) => e.is(setVizOptionsEffect)))
        ) {
          this.decorations = this.build(update.view);
        }
      }
      build(view: EditorView) {
        const decos: any[] = [];
        const { state } = view;
        for (const { from, to } of view.visibleRanges) {
          const text = state.doc.sliceString(from, to);
          let pos = from;
          for (let i = 0; i < text.length; i++, pos++) {
            const c = text.charCodeAt(i);
            const ch = text[i];
            if (options.showWhitespace) {
              if (ch === ' ' && options.whitespaceSpaces) {
                decos.push(
                  Decoration.mark({ class: 'cm-ws-mark cm-ws-mark-space' }).range(pos, pos + 1)
                );
                decos.push(
                  Decoration.replace({
                    widget: new WhitespaceWidget('space', '·'),
                    inclusive: false,
                  }).range(pos, pos + 1)
                );
                continue;
              }
              if (ch === '\t' && options.whitespaceTabs) {
                decos.push(
                  Decoration.mark({ class: 'cm-ws-mark cm-ws-mark-tab' }).range(pos, pos + 1)
                );
                // タブは "⇥ " を使用
                decos.push(
                  Decoration.replace({
                    widget: new WhitespaceWidget('tab', '⇥ '),
                    inclusive: false,
                  }).range(pos, pos + 1)
                );
                continue;
              }
            }
            if (options.showControlChars) {
              if (isAsciiControl(c) && ch !== '\t' && ch !== '\n' && ch !== '\r') {
                const label =
                  options.controlCharFormat === 'caret' ? caretNotation(c) : unicodeNotation(c);
                decos.push(
                  Decoration.replace({
                    widget: new ControlCharWidget(label),
                    inclusive: false,
                  }).range(pos, pos + 1)
                );
                decos.push(Decoration.mark({ class: 'cm-ctrlchar-mark' }).range(pos, pos + 1));
              }
            }
          }
        }
        return Decoration.set(decos, true);
      }
    },
    { decorations: (v) => v.decorations }
  );
}

function vizExtension(options: VizOptions) {
  return [buildVizPlugin(options)];
}

function behaviorExtension(options: VizOptions) {
  const keys = [];

  // Tab handling
  if (options.indentWithTab) {
    keys.push(indentWithTab);
  } else {
    keys.push({ key: 'Tab', run: insertTabChar });
  }

  // Enter handling: Override default behavior if autoIndent is disabled
  keys.push({
    key: 'Enter',
    run: options.autoIndent ? insertNewlineAndIndent : insertNewline,
  });

  // Base keymaps
  keys.push(...defaultKeymap);
  keys.push(...historyKeymap);
  keys.push(...searchKeymap);
  keys.push(...completionKeymap);

  const exts: any[] = [keymap.of(keys)];
  if (options.autoIndent) {
    exts.push(indentOnInput());
  }
  return exts;
}

export function TextVizEditor({
  value,
  onChange,
  className,
  style,
  placeholder: placeholderText = '',

  lineWrapping = true,
  scrollable = true,
  readOnly = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [opts, setOpts] = useState<VizOptions>(defaultVizOptions);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOpts((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse TextVizEditor settings', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save settings
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
    }
  }, [opts, isLoaded]);

  // Sync value prop to editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  // Initialization
  useEffect(() => {
    if (!hostRef.current) return;
    const baseExtensions = [
      lineNumbers(),
      history(),
      drawSelection(),
      !readOnly ? highlightActiveLine() : [],
      highlightSelectionMatches(),
      autocompletion(),
      lineWrapping ? EditorView.lineWrapping : [],
      EditorView.updateListener.of((u) => {
        if (u.docChanged) onChange?.(u.state.doc.toString());
      }),
      EditorView.theme({
        '&': {
          fontSize: '14px',
          height: scrollable ? '320px' : 'auto',
          maxHeight: scrollable ? '600px' : 'none',
        },
        '.cm-scroller': { overflow: scrollable ? 'auto' : 'visible' },
        '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
        '.cm-activeLine': {
          backgroundColor: readOnly ? 'transparent !important' : null,
        },
        '.cm-ws-mark-space': { backgroundColor: 'rgba(255, 0, 0, 0.08)' },
        '.cm-ws-mark-tab': { backgroundColor: 'rgba(0, 100, 255, 0.10)' },
        '.cm-ws-symbol': {
          display: 'inline-block',
          textAlign: 'center',
          opacity: '0.8',
          userSelect: 'none',
        },
        '.cm-ws-space': {
          color: 'rgba(255, 0, 0, 0.8)',
          backgroundColor: 'rgba(255, 0, 0, 0.08)',
          width: '1ch',
        },
        '.cm-ws-tab': {
          color: 'rgba(0, 100, 255, 0.9)',
          backgroundColor: 'rgba(0, 100, 255, 0.10)',
          width: '2ch',
        },
        '.cm-ctrlchar-mark': { backgroundColor: 'rgba(255, 165, 0, 0.12)' },
        '.cm-ctrlchar': {
          fontSize: '0.85em',
          padding: '0 2px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255, 165, 0, 0.18)',
          color: 'rgba(140, 80, 0, 1)',
          userSelect: 'none',
        },
      }),
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      EditorState.tabSize.of(2),
      placeholder(placeholderText),
      vizCompartment.of(vizExtension(opts)),
      behaviorCompartment.of(behaviorExtension(opts)),
    ];
    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions: baseExtensions }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update extensions when options change
  useEffect(() => {
    const view = viewRef.current;
    if (view && isLoaded) {
      view.dispatch({
        effects: [
          vizCompartment.reconfigure(vizExtension(opts)),
          behaviorCompartment.reconfigure(behaviorExtension(opts)),
          setVizOptionsEffect.of(opts),
        ],
      });
    }
  }, [opts, isLoaded]);

  const settingsContent = (
    <div className="flex min-w-[200px] flex-col gap-4 p-2">
      <div className="flex flex-col gap-2">
        <Text strong className="mb-1 block text-[10px] text-gray-400 uppercase">
          表示設定
        </Text>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={opts.showControlChars}
            onChange={(e) => setOpts((o) => ({ ...o, showControlChars: e.target.checked }))}
          />
          制御文字を可視化
        </label>
        <div className="ml-5 flex items-center gap-2">
          <span className="text-xs text-gray-500">表記:</span>
          <select
            style={{ fontSize: '12px' }}
            value={opts.controlCharFormat}
            disabled={!opts.showControlChars}
            onChange={(e) =>
              setOpts((o) => ({ ...o, controlCharFormat: e.target.value as ControlCharFormat }))
            }
          >
            <option value="caret">^表記</option>
            <option value="unicode">Unicode</option>
          </select>
        </div>

        <label className="mt-1 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={opts.showWhitespace}
            onChange={(e) => setOpts((o) => ({ ...o, showWhitespace: e.target.checked }))}
          />
          空白を可視化
        </label>
        <div className="ml-5 flex flex-col gap-1">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-500">
            <input
              type="checkbox"
              disabled={!opts.showWhitespace}
              checked={opts.whitespaceSpaces}
              onChange={(e) => setOpts((o) => ({ ...o, whitespaceSpaces: e.target.checked }))}
            />
            スペース (·)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-500">
            <input
              type="checkbox"
              disabled={!opts.showWhitespace}
              checked={opts.whitespaceTabs}
              onChange={(e) => setOpts((o) => ({ ...o, whitespaceTabs: e.target.checked }))}
            />
            タブ (⇥)
          </label>
        </div>
      </div>

      {!readOnly && (
        <>
          <div className="h-px bg-gray-100" />

          <div className="flex flex-col gap-2">
            <Text strong className="mb-1 block text-[10px] text-gray-400 uppercase">
              入力設定
            </Text>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={opts.indentWithTab}
                onChange={(e) => setOpts((o) => ({ ...o, indentWithTab: e.target.checked }))}
              />
              Tabでインデント
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={opts.autoIndent}
                onChange={(e) => setOpts((o) => ({ ...o, autoIndent: e.target.checked }))}
              />
              オートインデント
            </label>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`relative ${className}`} style={{ ...style }}>
      <div className="absolute top-1 right-1 z-10">
        <Popover
          content={settingsContent}
          title="Editor Settings"
          trigger="click"
          placement="bottomRight"
        >
          <Button
            size="small"
            type="text"
            icon={<SettingOutlined className="text-gray-400 hover:text-blue-500" />}
            className="flex items-center justify-center border border-gray-200 bg-white/80 shadow-sm backdrop-blur"
          />
        </Popover>
      </div>
      <div ref={hostRef} className="overflow-hidden rounded-md border border-gray-300" />
    </div>
  );
}
