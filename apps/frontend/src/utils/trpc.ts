import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../backend/server.js';

export const trpc = createTRPCReact<AppRouter>();
