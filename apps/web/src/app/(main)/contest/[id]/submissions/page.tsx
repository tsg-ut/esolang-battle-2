'use client';

import React, { useCallback, useEffect, useMemo } from 'react';

import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';

import { StringFilterDropdown } from '@/components/admin/StringFilterDropdown';
import { trpc } from '@/utils/trpc';
import { UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Table, Tag, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';

const { Text } = Typography;

type Scope = 'self' | 'team' | 'all';

export default function SubmissionsPage() {
  const params = useParams();
  const contestId = Number(params.id);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: me } = trpc.me.useQuery();
  const myTeam = me?.teams.find((t) => t.contestId === contestId);

  const { data: contest } = trpc.getContest.useQuery({ contestId });
  const isOver = contest ? new Date() > new Date(contest.endAt) : false;

  // URLから状態を取得
  const scope = (searchParams.get('scope') as Scope) || undefined;
  const currentPage = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 20;
  const sortField = searchParams.get('sortField') || undefined;
  const sortOrder = searchParams.get('sortOrder') || undefined;
  const filterUserName = searchParams.get('userName') || undefined;
  const filterUserNameOperator = searchParams.get('userNameOperator') || 'contains';

  // localStorageのキー (コンテスト共通)
  const storageKey = 'submissions_scope_preference';

  // 初期ロード時：URLにscopeがない場合はlocalStorageから復元
  useEffect(() => {
    if (!searchParams.get('scope')) {
      const savedScope = localStorage.getItem(storageKey) as Scope;
      const targetScope = savedScope || 'self';
      const params = new URLSearchParams(searchParams.toString());
      params.set('scope', targetScope);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, router, pathname, storageKey]);

  // scopeが変更されたら保存
  useEffect(() => {
    if (scope) {
      localStorage.setItem(storageKey, scope);
    }
  }, [scope, storageKey]);

  // 複数選択フィルタのデコード
  const filterProblemIds = useMemo(
    () => searchParams.getAll('problemId').map(Number),
    [searchParams]
  );
  const filterLanguageIds = useMemo(
    () => searchParams.getAll('languageId').map(Number),
    [searchParams]
  );
  const filterStatuses = useMemo(() => searchParams.getAll('status'), [searchParams]);

  // URLパラメータを更新するユーティリティ
  const updateUrl = useCallback(
    (updates: Record<string, string | string[] | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        params.delete(key);
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else if (value !== undefined && value !== null) {
          params.set(key, value);
        }
      });

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // tRPCフィルタの構築
  const filter: any = useMemo(() => {
    if (!scope) return null; // scopeが確定するまでフィルタを作らない

    const f: any = { contestId };
    if (scope === 'self' && me?.id) f.userId = me.id;
    if (scope === 'team' && myTeam?.id) f.teamId = Number(myTeam.id);

    if (filterUserName) {
      f.userName = { value: filterUserName, operator: filterUserNameOperator };
    }
    if (filterProblemIds.length > 0) f.problemId = filterProblemIds;
    if (filterLanguageIds.length > 0) f.languageId = filterLanguageIds;
    if (filterStatuses.length > 0) f.status = filterStatuses;

    if (sortField) {
      f.orderBy = sortField;
      f.order = sortOrder === 'ascend' ? 'asc' : 'desc';
    }

    f.limit = pageSize;
    f.offset = (currentPage - 1) * pageSize;

    return f;
  }, [
    contestId,
    scope,
    me?.id,
    myTeam?.id,
    filterUserName,
    filterProblemIds,
    filterLanguageIds,
    filterStatuses,
    sortField,
    sortOrder,
    currentPage,
  ]);

  const { data, isLoading } = trpc.getSubmissions.useQuery(filter, {
    enabled: !!me && !!filter,
    refetchInterval: 5000,
  });

  const { data: problems } = trpc.listProblems.useQuery({ contestId });
  const { data: languages } = trpc.getLanguages.useQuery();

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<any> | SorterResult<any>[]
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;

    // StringFilterDropdown は [{ operator, value }] を返すため、値を抽出する
    const userNameFilterObj = filters.userName ? (filters.userName[0] as any) : null;

    updateUrl({
      page: pagination.current ? String(pagination.current) : '1',
      pageSize: pagination.pageSize ? String(pagination.pageSize) : '20',
      sortField: s.field as string,
      sortOrder: s.order as string,
      userName: userNameFilterObj?.value,
      userNameOperator: userNameFilterObj?.operator,
      problemId: filters.problemId as string[],
      languageId: filters.languageId as string[],
      status: filters.status as string[],
    });
  };

  const columns: ColumnsType<any> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      defaultSortOrder: sortField === 'id' ? (sortOrder as any) : undefined,
      width: 80,
      render: (id: number) => (
        <Link href={`/contest/${contestId}/submissions/${id}`} className="font-mono text-blue-600">
          {id}
        </Link>
      ),
    },
    {
      title: 'ユーザ',
      key: 'userName',
      filteredValue: filterUserName
        ? ([{ operator: filterUserNameOperator, value: filterUserName }] as any)
        : null,
      filterDropdown: (props) => <StringFilterDropdown {...props} />,
      render: (_, record) => (
        <Link
          href={`/user/${record.user.id}`}
          className="flex items-center gap-2 text-gray-900 hover:text-blue-600"
        >
          <Avatar
            size="small"
            src={record.user.image}
            icon={!record.user.image && <UserOutlined />}
            className="flex-shrink-0"
          />
          <Text className="truncate hover:underline">{record.user.name}</Text>
        </Link>
      ),
    },
    {
      title: 'チーム',
      key: 'team',
      render: (_, record) => {
        const team = record.user.teams.find((t: any) => t.contestId === contestId);
        if (!team) return <span className="text-gray-400 italic">無所属</span>;
        return (
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 flex-shrink-0 rounded-full border border-gray-200"
              style={{ backgroundColor: team.color }}
            />
            <span className={!team.name ? 'text-gray-500 italic' : 'font-medium'}>
              {team.name || `(名前なし: ${team.color})`}
            </span>
          </div>
        );
      },
    },
    {
      title: '問題',
      dataIndex: 'problemId',
      key: 'problemId',
      filteredValue: filterProblemIds.length > 0 ? filterProblemIds.map(String) : null,
      filters: problems?.map((p) => ({ text: p.title, value: String(p.id) })),
      filterSearch: true,
      render: (_, record) => (
        <Link href={`/contest/${contestId}/problem/${record.problem.id}`}>
          <Text className="hover:underline">{record.problem.title}</Text>
        </Link>
      ),
    },
    {
      title: '言語',
      dataIndex: 'languageId',
      key: 'languageId',
      filteredValue: filterLanguageIds.length > 0 ? filterLanguageIds.map(String) : null,
      filters: languages?.map((l) => ({ text: l.name, value: String(l.id) })),
      filterSearch: true,
      render: (_, record) => record.language.name,
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      filteredValue: filterStatuses.length > 0 ? filterStatuses : null,
      filters: [
        { text: 'AC', value: 'AC' },
        { text: 'WA', value: 'WA' },
        { text: 'TLE', value: 'TLE' },
        { text: 'RE', value: 'RE' },
        { text: 'WJ', value: 'WJ' },
      ],
      render: (status: string) => {
        const colorMap: any = {
          AC: 'success',
          WA: 'warning',
          TLE: 'warning',
          RE: 'error',
          WJ: 'default',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'バイト数',
      dataIndex: 'codeLength',
      key: 'codeLength',
      sorter: true,
      defaultSortOrder: sortField === 'codeLength' ? (sortOrder as any) : undefined,
      align: 'center',
    },
    {
      title: 'スコア',
      dataIndex: 'score',
      key: 'score',
      sorter: true,
      defaultSortOrder: sortField === 'score' ? (sortOrder as any) : undefined,
      align: 'center',
      render: (score: number | null) =>
        score !== null ? (
          <span className="font-mono text-lg font-bold text-blue-600">{score}</span>
        ) : (
          <span className="animate-pulse text-xs text-gray-400 italic">採点中...</span>
        ),
    },
    {
      title: '提出時刻',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      sorter: true,
      defaultSortOrder: sortField === 'submittedAt' ? (sortOrder as any) : undefined,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '詳細',
      key: 'action',
      render: (_, record) => (
        <Link href={`/contest/${contestId}/submissions/${record.id}`} className="text-blue-600">
          詳細
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 overflow-scroll">
      <div className="flex gap-2">
        <Button
          type={scope === 'self' ? 'primary' : 'default'}
          onClick={() => updateUrl({ scope: 'self', page: '1' })}
        >
          自分の提出
        </Button>
        <Button
          type={scope === 'team' ? 'primary' : 'default'}
          disabled={!myTeam}
          onClick={() => updateUrl({ scope: 'team', page: '1' })}
        >
          自チームの提出
        </Button>
        {(me?.isAdmin || isOver) && (
          <Button
            type={scope === 'all' ? 'primary' : 'default'}
            onClick={() => updateUrl({ scope: 'all', page: '1' })}
          >
            全ての提出
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={data?.items}
        rowKey="id"
        loading={isLoading}
        onChange={handleTableChange}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: data?.total,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100'],
        }}
        size="middle"
        bordered
      />
    </div>
  );
}
