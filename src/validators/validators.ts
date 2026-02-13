import {z} from "zod";

export const registerSchema = z.object({

    name: z.string().min(1, "Name is required").max(50).trim(),
    email: z.string().min(1, "Email is required").email("Invalid email format").trim(),
    password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const loginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email format").trim(),
    password: z.string().min(6, "Password must be at least 6 characters").max(100),
});



export const createWorkspaceSchema = z.object({
    name: z.string().min(1, "Workspace name is required").max(100).trim(),
    description: z.string().max(500).trim().optional(),
});

export const updateWorkspaceSchema = z.object({
    name: z.string().min(1, "Workspace name is required").max(100).trim(),
    description: z.string().max(500).trim().optional(),
});

export const inviteMemberSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email format").trim(),
    role: z.enum(["admin", "member"]).optional().default("member"),
});