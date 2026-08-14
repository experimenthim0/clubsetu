import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import express from "express";
import scannerRoutes from "../scanner.js";

const app = express();
app.use(express.json());
app.use("/api/scanner", scannerRoutes);

let server;
let baseUrl;

beforeAll(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

describe("Scanner API Endpoints", () => {
  it("GET /api/scanner/keys/public should return the Ed25519 public key", async () => {
    const res = await fetch(`${baseUrl}/api/scanner/keys/public`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("keys");
    expect(Array.isArray(data.keys)).toBe(true);
    expect(data.keys[0]).toHaveProperty("keyId", "cn-qr-2026-01");
    expect(data.keys[0]).toHaveProperty("algorithm", "Ed25519");
    expect(data.keys[0].publicKey).toContain("BEGIN PUBLIC KEY");
  });

  it("POST /api/scanner/login without body should return 400 validation error", async () => {
    const res = await fetch(`${baseUrl}/api/scanner/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

