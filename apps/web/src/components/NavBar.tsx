'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { trpc } from '@/utils/trpc';

export default function NavBar() {
  const pathname = usePathname();
  const { data: me } = trpc.me.useQuery();

  const isAdmin = me?.isAdmin;

  return (
    <div className="ml-auto flex gap-2">
      {isAdmin && (
        <Link
          href="/admin/users"
          className={`rounded px-4 py-2 ${
            pathname === '/admin/users' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Admin page
        </Link>
      )}
      <Link
        href="/user"
        className={`rounded px-4 py-2 ${
          pathname === '/user' ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
      >
        ユーザー
      </Link>
    </div>
  );
}
