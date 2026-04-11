import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    name: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const contestIdSchema: z.ZodObject<{
    contestId: z.ZodNumber;
}, z.core.$strip>;
export declare const problemIdSchema: z.ZodObject<{
    problemId: z.ZodNumber;
}, z.core.$strip>;
export declare const submissionIdSchema: z.ZodObject<{
    submissionId: z.ZodNumber;
}, z.core.$strip>;
export declare const listProblemsSchema: z.ZodObject<{
    contestId: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const submissionFilterSchema: z.ZodOptional<z.ZodObject<{
    userId: z.ZodOptional<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodNumber>;
    problemId: z.ZodOptional<z.ZodNumber>;
    languageId: z.ZodOptional<z.ZodNumber>;
    contestId: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
export declare const testCodeSchema: z.ZodObject<{
    code: z.ZodString;
    languageId: z.ZodNumber;
}, z.core.$strip>;
export declare const submitCodeSchema: z.ZodObject<{
    code: z.ZodString;
    languageId: z.ZodNumber;
    problemId: z.ZodNumber;
}, z.core.$strip>;
export declare const submittableLanguageSchema: z.ZodObject<{
    teamId: z.ZodNumber;
    contestId: z.ZodNumber;
}, z.core.$strip>;
export declare const upsertProblemSchema: z.ZodObject<{
    id: z.ZodNullable<z.ZodNumber>;
    contestId: z.ZodNumber;
    title: z.ZodString;
    problemStatement: z.ZodString;
}, z.core.$strip>;
export declare const upsertContestSchema: z.ZodObject<{
    id: z.ZodNullable<z.ZodNumber>;
    name: z.ZodString;
    startAt: z.ZodCoercedDate<unknown>;
    endAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const upsertTeamSchema: z.ZodObject<{
    id: z.ZodNullable<z.ZodNumber>;
    color: z.ZodString;
    contestId: z.ZodNumber;
}, z.core.$strip>;
export declare const upsertLanguageSchema: z.ZodObject<{
    id: z.ZodNullable<z.ZodNumber>;
    name: z.ZodString;
    description: z.ZodString;
    dockerImageId: z.ZodString;
}, z.core.$strip>;
export declare const upsertTestCaseSchema: z.ZodObject<{
    id: z.ZodNullable<z.ZodNumber>;
    problemId: z.ZodNumber;
    input: z.ZodString;
    output: z.ZodString;
    isSample: z.ZodBoolean;
    checkerScript: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const updateUserTeamSchema: z.ZodObject<{
    userId: z.ZodNumber;
    teamId: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
export type TeamInfo = {
    id: number;
    color: string;
    contestId: number;
};
export type UserInfo = {
    id: number;
    name: string;
    isAdmin: boolean;
    teams: TeamInfo[];
};
export type LanguageSummary = {
    id: number;
    name: string;
    description: string;
};
export type ProblemSummary = {
    id: number;
    title: string;
};
export * from './board';
