import { Request, Response, NextFunction } from "express";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// ─── Must be before any imports that use these modules ────────────────────────

jest.mock("../db/queries/authQueries.js", () => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.mock("../shared/utils/tokenUtils.js", () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  storeRefreshToken: jest.fn(),
  getStoredRefreshToken: jest.fn(),
  deleteRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  decodeAccessToken: jest.fn(),
}));

// Zod validators — mock so we control what gets parsed without real validation
jest.mock("../validators/validators.js", () => ({
  registerSchema: { parse: jest.fn() },
  loginSchema: { parse: jest.fn() },
}));

// ─── Controller imports (mocks are already in place) ─────────────────────────
import { register, login, refreshToken, logout } from "../modules/auth/authControllers.js";

// ─── Query / utility imports (these are the mocked versions) ─────────────────
import { findUserByEmail, createUser } from "../db/queries/authQueries.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  getStoredRefreshToken,
  deleteRefreshToken,
  verifyAccessToken,
  decodeAccessToken,
} from "../shared/utils/tokenUtils.js";
import { registerSchema, loginSchema } from "../validators/validators.js";
import { mock } from "node:test";

// ─── Typed mock references ────────────────────────────────────────────────────
const mockFindUserByEmail = findUserByEmail as jest.MockedFunction<typeof findUserByEmail>;
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
const mockGenerateAccessToken = generateAccessToken as jest.MockedFunction<typeof generateAccessToken>;
const mockGenerateRefreshToken = generateRefreshToken as jest.MockedFunction<typeof generateRefreshToken>;
const mockStoreRefreshToken = storeRefreshToken as jest.MockedFunction<typeof storeRefreshToken>;
const mockGetStoredRefreshToken = getStoredRefreshToken as jest.MockedFunction<typeof getStoredRefreshToken>;
const mockDeleteRefreshToken = deleteRefreshToken as jest.MockedFunction<typeof deleteRefreshToken>;
const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;
const mockDecodeAccessToken = decodeAccessToken as jest.MockedFunction<typeof decodeAccessToken>;
const mockRegisterParse = registerSchema.parse as jest.MockedFunction<typeof registerSchema.parse>;
const mockLoginParse = loginSchema.parse as jest.MockedFunction<typeof loginSchema.parse>;

// ─── Mock factory ─────────────────────────────────────────────────────────────
// auth controllers use req.body, req.headers, req.cookies — not req.params
function makeMocks({
  body = {},
  headers = {},
  cookies = {},
}: {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
} = {}) {
  const req = { body, headers, cookies } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),         // used by register/login/refreshToken
    clearCookie: jest.fn().mockReturnThis(),    // used by logout
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

beforeEach(async () => jest.clearAllMocks());


describe("register", () => {

  describe("Success Cases", () => {
    it("should create user and return 201 with tokens", async () => {
      // Zod parse returns clean data
      mockRegisterParse.mockReturnValue({ name: "Test", email: "t@test.com", password: "Test1234" });
      // No existing user
      mockFindUserByEmail.mockResolvedValue(null);
      // bcrypt hashes the password
      mockHash.mockResolvedValue("hashed-pass" as never);
      // DB creates user and returns new userId
      mockCreateUser.mockResolvedValue("user-1");
      // Token generation
      mockGenerateAccessToken.mockReturnValue("access-1");
      mockGenerateRefreshToken.mockReturnValue("refresh-1");
      mockStoreRefreshToken.mockResolvedValue(undefined);

      const { req, res, next } = makeMocks({
        body: { name: "Test", email: "t@test.com", password: "Test1234" },
      });
      await register(req, res, next);

      // Correct data passed to DB
      expect(mockFindUserByEmail).toHaveBeenCalledWith("t@test.com");
      expect(mockHash).toHaveBeenCalledWith("Test1234", expect.any(Number));
      expect(mockCreateUser).toHaveBeenCalledWith("Test", "t@test.com", "hashed-pass");

      // Access token built with correct payload
      expect(mockGenerateAccessToken).toHaveBeenCalledWith({ userId: "user-1", email: "t@test.com" });

      // Refresh token stored against correct userId
      expect(mockStoreRefreshToken).toHaveBeenCalledWith("user-1", "refresh-1");

      // Cookie set with httpOnly
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-1",
        expect.objectContaining({ httpOnly: true })
      );

      // Response shape matches controller output exactly
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Registration successful",
        data: {
          accessToken: "access-1",
          user: { userId: "user-1", name: "Test", email: "t@test.com" },
        },
      });

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Conflict Errors", () => {
    it("should throw AppError when email already exists", async () => {
      mockRegisterParse.mockReturnValue({ name: "Test", email: "t@test.com", password: "Test1234" });
      // Simulate existing user found in DB
      mockFindUserByEmail.mockResolvedValue({ id: "existing-user" } as any);

      const { req, res, next } = makeMocks({
        body: { name: "Test", email: "t@test.com", password: "Test1234" },
      });
      await register(req, res, next);

      // asyncHandler catches the thrown AppError and passes it to next
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      // DB should never reach createUser
      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });

  describe("Database Errors", () => {
    it("should call next(error) when findUserByEmail throws", async () => {
      mockRegisterParse.mockReturnValue({ name: "Test", email: "t@test.com", password: "Test1234" });
      mockFindUserByEmail.mockRejectedValue(new Error("DB connection lost"));

      const { req, res, next } = makeMocks({ body: { name: "Test", email: "t@test.com", password: "Test1234" } });
      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next(error) when createUser throws", async () => {
      mockRegisterParse.mockReturnValue({ name: "Test", email: "t@test.com", password: "Test1234" });
      mockFindUserByEmail.mockResolvedValue(null);
      mockHash.mockResolvedValue("hashed-pass" as never);
      mockCreateUser.mockRejectedValue(new Error("Insert failed"));

      const { req, res, next } = makeMocks({ body: { name: "Test", email: "t@test.com", password: "Test1234" } });
      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("Redis Errors", () => {
    it("should call next(error) when storeRefreshToken throws", async () => {
      mockRegisterParse.mockReturnValue({ name: "Test", email: "t@test.com", password: "Test1234" });
      mockFindUserByEmail.mockResolvedValue(null);
      mockHash.mockResolvedValue("hashed-pass" as never);
      mockCreateUser.mockResolvedValue("user-1");
      mockGenerateAccessToken.mockReturnValue("access-1");
      mockGenerateRefreshToken.mockReturnValue("refresh-1");
      // Redis fails
      mockStoreRefreshToken.mockRejectedValue(new Error("Redis down"));

      const { req, res, next } = makeMocks({ body: { name: "Test", email: "t@test.com", password: "Test1234" } });
      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

describe("login", () => {
  const fakeUser = {
    id: "user-1",
    name: "Test",
    email: "t@test.com",
    password: "hashed-pass"
  };

  describe("Success Cases", () => {
    it("should return 200 with access token on valid credentials", async () => {

      mockLoginParse.mockReturnValue({ email: "t@test.com", password: "Test1234" });

      mockFindUserByEmail.mockResolvedValue(fakeUser as any);

      // bcrypt.compare returns true for valid password
      mockCompare.mockResolvedValue(true as never);

      mockGenerateAccessToken.mockReturnValue("access-1");
      mockGenerateRefreshToken.mockReturnValue("refresh-1");
      mockStoreRefreshToken.mockResolvedValue(undefined);
      const { req, res, next } = makeMocks({
        body: { email: "t@test.com", password: "Test1234" }
      });
      await login(req, res, next);

      expect(mockCompare).toHaveBeenCalledWith("Test1234", "hashed-pass");

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-1",
        expect.objectContaining({ httpOnly: true })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Login Successful",
        data: {
          accessTken: "access-1",
          user: { id: "user-1", name: "Test", email: "t@test.com" },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Authentication Error", () => {
    it("should call AuthError when user not found", async () => {

      mockLoginParse.mockReturnValue({ email: "t@test.com", password: "Test1234" });
      mockFindUserByEmail.mockResolvedValue(null);

      const { req, res, next } = makeMocks({
        body: { email: "t@test.com", password: "Test1234" }
      });
      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      //should not call bcrypt.compare if user not found
      expect(mockCompare).not.toHaveBeenCalled();
    });

    it("should throw AuthError when assword is wrong", async () => {
      mockLoginParse.mockReturnValue({
        email: "t@test.com",
        password: "WrongPass"
      });

      // BCRYPT COMPARE RETURNS FALSE FOR WRONG PASSWORD
      mockFindUserByEmail.mockResolvedValue(fakeUser as any);

      mockCompare.mockResolvedValue(false as never);

      const { req, res, next } = makeMocks({
        body: { email: "t@test.com", password: "WrongPass" }
      });

      await login(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      expect(mockCompare).toHaveBeenCalledWith("WrongPass", "hashed-pass");
      //Tokens should not be generated if authentication fails
      expect(mockGenerateAccessToken).not.toHaveBeenCalled();
    });
  });
});









