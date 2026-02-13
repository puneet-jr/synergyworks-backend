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


export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int({ message: "Page must be an integer" })
    .positive({ message: "Page must be a positive integer" })
    .default(1),

  limit: z.coerce
    .number()
    .int({ message: "Limit must be an integer" })
    .positive({ message: "Limit must be a positive integer" })
    .max(100, { message: "Limit cannot exceed 100" }) 
    .default(20),

  search: z.string().max(100).trim().optional(),
});