import { NextResponse } from 'next/server';

import { appRouter } from '@/server/routers/_app';
import { generateOpenApiDocument } from 'trpc-to-openapi';

export const GET = () => {
  const openApiDocument = generateOpenApiDocument(appRouter, {
    title: 'Esolang Battle 2 API',
    description: 'API for Esolang Battle 2',
    version: '1.0.0',
    baseUrl: '/api/rest',
  });
  return NextResponse.json(openApiDocument);
};
