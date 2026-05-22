'use client';

import React, { useEffect, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { App, Button, Select, Tag, Typography, Upload } from 'antd';

import { MAX_CODE_SIZE } from '@esolang-battle/common';

import { TextVizEditor } from './TextVizEditor';

const { Text } = Typography;

export interface Language {
  id: number;
  name: string;
}

interface CodeSubmitFormProps {
  languages: Language[];
  selectedLanguageId: string;
  onLanguageChange: (id: string) => void;
  onSubmit: (data: { code: string; isBase64: boolean; fileName: string | null }) => Promise<void>;
  submitLoading: boolean;
  submitText: string;
  initialCode?: string;
  initialIsBase64?: boolean;
  initialFileName?: string | null;
  extraFields?: React.ReactNode;
  afterCodeFields?: React.ReactNode;
  footerActions?: React.ReactNode;
  disabled?: boolean;
}

export const CodeSubmitForm: React.FC<CodeSubmitFormProps> = ({
  languages,
  selectedLanguageId,
  onLanguageChange,
  onSubmit,
  submitLoading,
  submitText,
  initialCode = '',
  initialIsBase64 = false,
  initialFileName = null,
  extraFields,
  afterCodeFields,
  footerActions,
  disabled = false,
}) => {
  const { message } = App.useApp();
  const [code, setCode] = useState(initialCode);
  const [isBase64, setIsBase64] = useState(initialIsBase64);
  const [fileName, setFileName] = useState<string | null>(initialFileName);

  // 外部からの初期コード反映 (Code Test等でのリセット用)
  useEffect(() => {
    let finalCode = initialCode;
    let finalIsBase64 = initialIsBase64;

    // ファイル名がなく Base64 の場合は「転送用にエンコードされたテキスト」とみなしてデコードを試みる
    if (initialIsBase64 && !initialFileName && initialCode) {
      try {
        const bin = atob(initialCode);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        finalCode = new TextDecoder().decode(bytes);
        finalIsBase64 = false;
      } catch (e) {
        console.error('Failed to decode initial Base64 code', e);
      }
    }

    setCode(finalCode);
    setIsBase64(finalIsBase64);
    setFileName(initialFileName);
  }, [initialCode, initialIsBase64, initialFileName]);

  const handleFileUpload = (file: File) => {
    if (file.size > MAX_CODE_SIZE) {
      message.error(`ファイルサイズが大きすぎます (最大 ${MAX_CODE_SIZE / 1024 / 1024}MB)`);
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result;
      if (arrayBuffer instanceof ArrayBuffer) {
        // 1. UTF-8 としてデコードを試みる
        try {
          const decoder = new TextDecoder('utf-8', { fatal: true });
          const text = decoder.decode(arrayBuffer);

          // 成功した場合はテキストとしてエディタにセット
          setCode(text);
          setIsBase64(false);
          setFileName(file.name);
          message.success(`ファイルからテキストを読み込みました: ${file.name}`);
        } catch (err) {
          // 2. UTF-8 ではない（バイナリ）場合は Base64 として保持
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          setCode(base64);
          setIsBase64(true);
          setFileName(file.name);
          message.info(`バイナリファイルを読み込みました: ${file.name} (編集不可)`);
        }
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    setIsBase64(false);
    setFileName(null);
  };

  const codeBytes = isBase64
    ? (code.length * 3) / 4 - (code.endsWith('==') ? 2 : code.endsWith('=') ? 1 : 0)
    : new TextEncoder().encode(code).length;
  const isTooLarge = codeBytes > MAX_CODE_SIZE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLanguageId) {
      message.error('言語を選択してください');
      return;
    }

    let finalCode = code;
    let finalIsBase64 = isBase64;

    // 制御文字が含まれる場合、安全のために Base64 化して送信する
    if (!isBase64) {
      // ヌル文字または ASCII 制御文字（改行・タブ以外）が含まれるかチェック
      const hasControls = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(code);
      if (hasControls) {
        const bytes = new TextEncoder().encode(code);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        finalCode = btoa(binary);
        finalIsBase64 = true;
      }
    }

    await onSubmit({ code: finalCode, isBase64: finalIsBase64, fileName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-xs">
          <label htmlFor="language-select" className="mb-2 block text-sm font-medium text-gray-700">
            言語選択
          </label>
          <Select
            id="language-select"
            showSearch
            className="w-full"
            value={selectedLanguageId || undefined}
            onChange={onLanguageChange}
            placeholder="言語を選択"
            optionFilterProp="name"
            fieldNames={{ label: 'name', value: 'id' }}
            options={languages.map((l) => ({ id: String(l.id), name: l.name }))}
            filterOption={(input, option) =>
              String(option?.name ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </div>
        <Upload beforeUpload={handleFileUpload} showUploadList={false} accept="*">
          <Button icon={<UploadOutlined />}>ファイルからロード</Button>
        </Upload>
      </div>

      {extraFields}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">ソースコード</label>
          {fileName && (
            <Tag
              color="blue"
              closable
              onClose={() => {
                setCode('');
                setFileName(null);
                setIsBase64(false);
              }}
            >
              Source: {fileName}
            </Tag>
          )}
        </div>

        {isBase64 && fileName ? (
          <div className="rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 p-12 text-center">
            <Text strong className="mb-2 block text-blue-600">
              {fileName} (バイナリデータ) をロード済み
            </Text>
            <Text type="secondary" className="mb-6 block text-xs">
              UTF-8として読み込めないため、エディタでは表示・編集できません。
            </Text>
            <Button
              type="primary"
              ghost
              onClick={() => {
                setFileName(null);
                setCode('');
                setIsBase64(false);
              }}
            >
              クリアしてエディタに戻る
            </Button>
          </div>
        ) : (
          <div className={isTooLarge ? 'rounded-xl border-2 border-red-500' : ''}>
            <TextVizEditor
              value={code}
              onChange={handleCodeChange}
              placeholder="ここにコードを入力、またはファイルをロード..."
              className="w-full"
            />
          </div>
        )}

        <div className="mt-2 flex justify-end gap-4 text-xs text-gray-500">
          {!isBase64 && <span>文字数: {code.length} chars</span>}
          <span className={isTooLarge ? 'font-bold text-red-500' : ''}>
            バイト数: {Math.round(codeBytes)} bytes{' '}
            {isTooLarge && `(Limit: ${MAX_CODE_SIZE / 1024 / 1024}MB)`}
          </span>
        </div>
      </div>

      {afterCodeFields}

      <div className="flex items-center justify-end gap-4">
        {footerActions}
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={submitLoading}
          disabled={disabled || !selectedLanguageId || isTooLarge}
          className="px-12 font-bold"
        >
          {submitText}
        </Button>
      </div>
    </form>
  );
};
