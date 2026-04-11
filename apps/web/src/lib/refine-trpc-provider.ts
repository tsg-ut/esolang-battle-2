import type { AppRouter } from '@/server/routers/_app';
import { DataProvider } from '@refinedev/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
});

export const trpcDataProvider = (): DataProvider => ({
  getList: async ({ resource, filters, sorters }) => {
    const r = resource.toLowerCase();
    let data: any[] = [];

    const getFilterValue = (field: string) => filters?.find((f: any) => f.field === field)?.value;

    switch (r) {
      case 'users':
        data = await client.adminGetUsers.query();
        break;
      case 'contests':
        data = await client.adminGetContests.query();
        break;
      case 'teams':
        data = await client.adminGetTeams.query();
        break;
      case 'languages':
        data = await client.adminGetLanguages.query();
        break;
      case 'problems':
        {
          const contestId = getFilterValue('contestId');
          data = await client.adminGetProblems.query({
            contestId: contestId ? Number(contestId) : undefined,
          });
        }
        break;
      case 'testcases':
        const problemId = getFilterValue('problemId');
        data = await client.adminGetTestCases.query({
          problemId: problemId ? Number(problemId) : undefined,
        });
        break;
      case 'boards':
        data = await client.adminGetBoards.query();
        break;
      default:
        throw new Error(`Unknown resource: ${resource}`);
    }

    // 2. フィルタリング処理
    if (filters && filters.length > 0) {
      console.log(filters);
      data = data.filter((item) => {
        return filters.every((filter: any) => {
          if (filter.field === 'contestId' || filter.field === 'problemId') return true;

          const val = item[filter.field];
          let filterVal = filter.value;
          let operator = filter.operator;

          // 配列の中にオブジェクトが入っているパターン (AntD custom filter) の展開
          if (Array.isArray(filterVal) && filterVal.length > 0) {
            filterVal = filterVal[0];
          }

          // オブジェクトの中に operator や isExact が入っているパターンの展開
          if (filterVal && typeof filterVal === 'object') {
            if ('operator' in filterVal) {
              operator = filterVal.operator;
              filterVal = filterVal.value;
            } else if ('isExact' in filterVal) {
              operator = filterVal.isExact ? 'eq' : 'contains';
              filterVal = filterVal.value;
            }
          }

          if (filterVal === undefined || filterVal === null || filterVal === '') return true;

          const stringVal = String(val).toLowerCase();
          const stringFilterVal = String(filterVal).toLowerCase();

          // 最終的な判定
          switch (operator) {
            case 'eq':
              return String(val) === String(filterVal);
            case 'contains':
              return stringVal.includes(stringFilterVal);
            default:
              // オペレーターが eq や in の場合でも、文字列なら部分一致をデフォルトとする（UX向上のため）
              return typeof val === 'string'
                ? stringVal.includes(stringFilterVal)
                : String(val) === String(filterVal);
          }
        });
      });
    }

    // 3. ソート処理
    if (sorters && sorters.length > 0) {
      const { field, order } = sorters[0];
      data.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return {
      data,
      total: data.length,
    };
  },

  getOne: async ({ resource, id }) => {
    const r = resource.toLowerCase();
    switch (r) {
      case 'users':
        return { data: await client.adminGetUser.query({ id: Number(id) }) };
      case 'contests':
        return { data: await client.adminGetContest.query({ id: Number(id) }) };
      case 'teams':
        return { data: await client.adminGetTeam.query({ id: Number(id) }) };
      case 'languages':
        return { data: await client.adminGetLanguage.query({ id: Number(id) }) };
      case 'problems':
        return { data: await client.adminGetProblem.query({ id: Number(id) }) };
      case 'testcases':
        return { data: await client.adminGetTestCase.query({ id: Number(id) }) };
      case 'boards':
        return { data: await client.adminGetBoard.query({ id: Number(id) }) };
      default:
        throw new Error(`Unknown resource: ${resource}`);
    }
  },

  create: async ({ resource, variables }) => {
    const r = resource.toLowerCase();
    let data: any;
    switch (r) {
      case 'contests':
        data = await client.adminUpsertContest.mutate({ id: null, ...variables } as any);
        break;
      case 'teams':
        data = await client.adminUpsertTeam.mutate({ id: null, ...variables } as any);
        break;
      case 'languages':
        data = await client.adminUpsertLanguage.mutate({ id: null, ...variables } as any);
        break;
      case 'problems':
        data = await client.adminUpsertProblem.mutate({ id: null, ...variables } as any);
        break;
      case 'testcases':
        data = await client.adminUpsertTestCase.mutate({ id: null, ...variables } as any);
        break;
      case 'boards':
        data = await client.adminUpsertBoard.mutate({ id: null, ...variables } as any);
        break;
      default:
        throw new Error(`Create not supported for resource: ${resource}`);
    }
    return { data };
  },

  update: async ({ resource, id, variables }) => {
    const r = resource.toLowerCase();
    let data: any;
    switch (r) {
      case 'users':
        data = await client.adminUpdateUserTeam.mutate({
          userId: Number(id),
          teamId: variables.teamId,
        });
        break;
      case 'contests':
        data = await client.adminUpsertContest.mutate({ id: Number(id), ...variables } as any);
        break;
      case 'teams':
        data = await client.adminUpsertTeam.mutate({ id: Number(id), ...variables } as any);
        break;
      case 'languages':
        data = await client.adminUpsertLanguage.mutate({ id: Number(id), ...variables } as any);
        break;
      case 'problems':
        data = await client.adminUpsertProblem.mutate({ id: Number(id), ...variables } as any);
        break;
      case 'testcases':
        data = await client.adminUpsertTestCase.mutate({ id: Number(id), ...variables } as any);
        break;
      case 'boards':
        data = await client.adminUpsertBoard.mutate({ id: Number(id), ...variables } as any);
        break;
      default:
        throw new Error(`Update not supported for resource: ${resource}`);
    }
    return { data };
  },

  deleteOne: async ({ resource, id }) => {
    const r = resource.toLowerCase();
    let data: any;
    switch (r) {
      case 'contests':
        data = await client.adminDeleteContest.mutate({ id: Number(id) });
        break;
      case 'teams':
        data = await client.adminDeleteTeam.mutate({ id: Number(id) });
        break;
      case 'languages':
        data = await client.adminDeleteLanguage.mutate({ id: Number(id) });
        break;
      case 'problems':
        data = await client.adminDeleteProblem.mutate({ id: Number(id) });
        break;
      case 'testcases':
        data = await client.adminDeleteTestCase.mutate({ id: Number(id) });
        break;
      default:
        throw new Error(`Delete not supported for resource: ${resource}`);
    }
    return { data };
  },

  deleteMany: async ({ resource, ids }) => {
    const r = resource.toLowerCase();
    const numericIds = ids.map(Number);
    let data: any;

    switch (r) {
      case 'contests':
        data = await client.adminDeleteContests.mutate({ ids: numericIds });
        break;
      case 'teams':
        data = await client.adminDeleteTeams.mutate({ ids: numericIds });
        break;
      case 'languages':
        data = await client.adminDeleteLanguages.mutate({ ids: numericIds });
        break;
      case 'problems':
        data = await client.adminDeleteProblems.mutate({ ids: numericIds });
        break;
      case 'testcases':
        data = await client.adminDeleteTestCases.mutate({ ids: numericIds });
        break;
      default:
        throw new Error(`DeleteMany not supported for resource: ${resource}`);
    }

    return { data };
  },

  getApiUrl: () => '/api/trpc',
});
