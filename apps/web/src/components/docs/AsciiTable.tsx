'use client';

import React, { memo, useCallback } from 'react';

import { CopyOutlined } from '@ant-design/icons';
import { App, Button, Tooltip, Typography } from 'antd';

const { Title } = Typography;

// --- Static ASCII Data Definition ---
const CONTROL_INFO: Record<number, { name: string; desc: string; esc?: string }> = {
  0: { name: 'NUL', desc: 'Null', esc: '\\0' },
  1: { name: 'SOH', desc: 'Start of Heading' },
  2: { name: 'STX', desc: 'Start of Text' },
  3: { name: 'ETX', desc: 'End of Text' },
  4: { name: 'EOT', desc: 'End of Transmission' },
  5: { name: 'ENQ', desc: 'Enquiry' },
  6: { name: 'ACK', desc: 'Acknowledgment' },
  7: { name: 'BEL', desc: 'Bell', esc: '\\a' },
  8: { name: 'BS', desc: 'Backspace', esc: '\\b' },
  9: { name: 'HT', desc: 'Tab', esc: '\\t' },
  10: { name: 'LF', desc: 'Newline', esc: '\\n' },
  11: { name: 'VT', desc: 'Vertical Tab', esc: '\\v' },
  12: { name: 'FF', desc: 'Form Feed', esc: '\\f' },
  13: { name: 'CR', desc: 'Return', esc: '\\r' },
  14: { name: 'SO', desc: 'Shift Out' },
  15: { name: 'SI', desc: 'Shift In' },
  16: { name: 'DLE', desc: 'Data Link Escape' },
  17: { name: 'DC1', desc: 'Device Control 1' },
  18: { name: 'DC2', desc: 'Device Control 2' },
  19: { name: 'DC3', desc: 'Device Control 3' },
  20: { name: 'DC4', desc: 'Device Control 4' },
  21: { name: 'NAK', desc: 'Negative Ack' },
  22: { name: 'SYN', desc: 'Synchronous Idle' },
  23: { name: 'ETB', desc: 'End of Trans. Block' },
  24: { name: 'CAN', desc: 'Cancel' },
  25: { name: 'EM', desc: 'End of Medium' },
  26: { name: 'SUB', desc: 'Substitute' },
  27: { name: 'ESC', desc: 'Escape', esc: '\\e' },
  28: { name: 'FS', desc: 'File Separator' },
  29: { name: 'GS', desc: 'Group Separator' },
  30: { name: 'RS', desc: 'Record Separator' },
  31: { name: 'US', desc: 'Unit Separator' },
  32: { name: 'SP', desc: 'Space' },
  127: { name: 'DEL', desc: 'Delete' },
};

const getCharData = (i: number) => {
  const ctrl = CONTROL_INFO[i];
  const isControl = i < 32 || i === 127;
  const caret = i < 32 ? `^${String.fromCharCode(i + 64)}` : i === 127 ? '^?' : null;
  return {
    code: i,
    hex: i.toString(16).toUpperCase().padStart(2, '0'),
    char: isControl ? ctrl?.name || 'CTRL' : String.fromCharCode(i),
    caret,
    escape: ctrl?.esc || null,
    desc: i < 32 ? ctrl?.desc || '' : null,
    isControl,
    showCopy: (i >= 0 && i <= 31) || i === 127,
  };
};

const ROWS = Array.from({ length: 32 }).map((_, rowIndex) => ({
  rowIndex,
  c0: getCharData(rowIndex),
  c1: getCharData(rowIndex + 32),
  c2: getCharData(rowIndex + 64),
  c3: getCharData(rowIndex + 96),
}));

export const AsciiTable = memo(({ extraTitleAction }: { extraTitleAction?: React.ReactNode }) => {
  const { message } = App.useApp();

  const handleCopy = useCallback(
    (val: number, name: string) => {
      const char = String.fromCharCode(val);
      navigator.clipboard
        .writeText(char)
        .then(() => {
          message.success(`Copied: ${name}`);
        })
        .catch(() => {
          message.error('Failed to copy');
        });
    },
    [message]
  );

  const renderCharContent = (data: any) => (
    <div className="flex w-full items-center gap-1.5 overflow-hidden py-0">
      <span
        className={`shrink-0 font-mono text-sm ${data.isControl ? 'font-bold text-orange-500' : 'font-black text-blue-600'}`}
      >
        {data.char}
      </span>
      {data.caret && (
        <span className="shrink-0 font-mono text-[13px] text-gray-400">({data.caret})</span>
      )}
      {data.escape && (
        <span className="m-0 shrink-0 rounded bg-gray-100 px-1 py-0 font-mono text-[13px] text-gray-500">
          {data.escape}
        </span>
      )}
      <div className="ml-auto flex items-center justify-end" style={{ minWidth: 20 }}>
        {data.showCopy && (
          <Tooltip title={`Copy Char (Code ${data.code})`}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ fontSize: '13px', color: 'gray' }} />}
              onClick={() => handleCopy(data.code, data.char)}
              className="flex h-5 w-5 items-center justify-center p-0"
            />
          </Tooltip>
        )}
      </div>
    </div>
  );

  const tdClass = 'px-2 py-0.2 border border-gray-200';
  const labelClass = 'px-2 py-0 text-center font-mono text-[13px] font-bold border border-gray-200';
  const hexClass =
    'px-2 py-0 text-center font-mono text-[13px] text-gray-400 border border-gray-200';
  const separatorClass = 'border-r-3 border-gray-200';

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <Title level={2} className="mb-0 text-xl">
          ASCII Table
        </Title>
        {extraTitleAction}
      </div>

      <div className="overflow-x-auto pb-4">
        <table className="w-full border-collapse border border-gray-300 bg-white shadow-sm">
          <thead className="bg-gray-50 text-[13px]">
            <tr>
              <th className={tdClass}>Dec</th>
              <th className={tdClass}>Hex</th>
              <th className={tdClass}>Char</th>
              <th className={`${tdClass} ${separatorClass}`}>Description</th>

              <th className={tdClass}>Dec</th>
              <th className={tdClass}>Hex</th>
              <th className={`${tdClass} ${separatorClass}`}>Char</th>

              <th className={tdClass}>Dec</th>
              <th className={tdClass}>Hex</th>
              <th className={`${tdClass} ${separatorClass}`}>Char</th>

              <th className={tdClass}>Dec</th>
              <th className={tdClass}>Hex</th>
              <th className={tdClass}>Char</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.rowIndex}
                className={`transition-colors hover:bg-gray-50 ${row.c0.isControl ? 'bg-orange-50/10' : ''}`}
              >
                {/* Set 1 (0-31) */}
                <td className={labelClass}>{row.c0.code}</td>
                <td className={hexClass}>{row.c0.hex}</td>
                <td className={tdClass}>{renderCharContent(row.c0)}</td>
                <td
                  className={`${tdClass} ${separatorClass} text-[13px] whitespace-nowrap text-gray-400 italic`}
                >
                  {row.c0.desc}
                </td>

                {/* Set 2 (32-63) */}
                <td className={labelClass}>{row.c1.code}</td>
                <td className={hexClass}>{row.c1.hex}</td>
                <td className={`${tdClass} ${separatorClass}`}>{renderCharContent(row.c1)}</td>

                {/* Set 3 (64-95) */}
                <td className={labelClass}>{row.c2.code}</td>
                <td className={hexClass}>{row.c2.hex}</td>
                <td className={`${tdClass} ${separatorClass}`}>{renderCharContent(row.c2)}</td>

                {/* Set 4 (96-127) */}
                <td className={labelClass}>{row.c3.code}</td>
                <td className={hexClass}>{row.c3.hex}</td>
                <td className={tdClass}>{renderCharContent(row.c3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

AsciiTable.displayName = 'AsciiTable';
