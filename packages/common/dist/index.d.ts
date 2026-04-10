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
export type SubmissionSummary = {
    id: number;
    codeLength: number;
    score: number;
    submittedAt: string;
    user: {
        id: number;
        name: string;
        teams: TeamInfo[];
    };
    language: LanguageSummary;
    problem: ProblemSummary;
};
