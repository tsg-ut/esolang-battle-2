'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

export default function ContestLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const contestId = params.id;

  const tabs = [
    { id: 'board', label: '盤面', path: `/contest/${contestId}/board` },
    { id: 'problem', label: '問題', path: `/contest/${contestId}/problem` },
    { id: 'standings', label: '順位表', path: `/contest/${contestId}/standings` },
    { id: 'submit', label: '新しい提出', path: `/contest/${contestId}/submit` },
    { id: 'submissions', label: '提出一覧', path: `/contest/${contestId}/submissions` },
    { id: 'code_test', label: 'コードテスト', path: `/contest/${contestId}/code_test` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const isActive = pathname === tab.path;
              return (
                <Link
                  key={tab.id}
                  href={tab.path}
                  className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
