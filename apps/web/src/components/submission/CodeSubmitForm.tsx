'use client';

import React, { useEffect, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { App, Button, Select, Tag, Upload } from 'antd';

export interface Language {
  id: number;
  name: string;
}

interface CodeSubmitFormProps {
  languages: Language[];
  selectedLanguageId: string;
  onLanguageChange: (id: string) => void;
  onSubmit: (data: { code: string; isBase64: boolean }) => Promise<void>;
  submitLoading: boolean;
  submitText: string;
  initialCode?: string;
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
  extraFields,
  afterCodeFields,
  footerActions,
  disabled = false,
}) => {
  const { message } = App.useApp();
  const [code, setCode] = useState(initialCode);
  const [isBase64, setIsBase64] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // 外部からの初期コード反映 (Code Test等でのリセット用)
  useEffect(() => {
    if (initialCode === '') {
      setCode('');
      setIsBase64(false);
      setFileName(null);
    } else {
      setCode(initialCode);
    }
  }, [initialCode]);

  const handleFileUpload = (file: File) => {
    const MAX_SIZE = 1 * 1024 * 1024; // 1MB
    if (file.size > MAX_SIZE) {
      message.error('ファイルサイズが大きすぎます (最大 1MB)');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        const base64Content = result.split(',')[1];
        setCode(base64Content);
        setIsBase64(true);
        setFileName(file.name);
        message.info(`ファイルを読み込みました: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setIsBase64(false);
    setFileName(null);
  };

  const codeBytes = isBase64 ? (code.length * 3) / 4 : new TextEncoder().encode(code).length;
  const isTooLarge = codeBytes > 1 * 1024 * 1024;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLanguageId) {
      message.error('言語を選択してください');
      return;
    }
    await onSubmit({ code, isBase64 });
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
              (option?.name ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
        <Upload beforeUpload={handleFileUpload} showUploadList={false} accept="*">
          <Button icon={<UploadOutlined />}>Upload File (Max 1MB)</Button>
        </Upload>
      </div>

      {extraFields}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="code-textarea" className="block text-sm font-medium text-gray-700">
            ソースコード
          </label>
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
              File: {fileName}
            </Tag>
          )}
        </div>
        <textarea
          id="code-textarea"
          rows={12}
          value={isBase64 ? '[File Content Loaded]' : code}
          onChange={handleCodeChange}
          disabled={isBase64}
          className={`block w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none ${isBase64 ? 'bg-gray-100 text-gray-500' : 'bg-gray-50'} ${isTooLarge ? 'border-red-500 ring-red-500' : ''}`}
          placeholder="ここにコードを入力、またはファイルをアップロード..."
        />
        <div className="mt-2 flex justify-end gap-4 text-xs text-gray-500">
          {!isBase64 && <span>文字数: {code.length} chars</span>}
          <span className={isTooLarge ? 'font-bold text-red-500' : ''}>
            バイト数: {Math.round(codeBytes)} bytes {isTooLarge && '(Limit: 1MB)'}
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
