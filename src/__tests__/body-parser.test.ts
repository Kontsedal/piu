import { createServer } from "../server";
import { context } from "../context";
import request from "supertest";

describe("body parser", () => {
  describe("json", () => {
    it("should parse json", async () => {
      const requestObj = { test: 1 };
      const server = createServer();
      server.use(async () => {
        const body = await context.requestBody.json();
        context.respondJson(body, 201);
      });
      const response = await request(server.httpServer)
        .post("/")
        .send(requestObj);
      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchObject(requestObj);
    });

    it("should return an empty object if json is invalid", async () => {
      const server = createServer();
      server.use(async () => {
        const body = await context.requestBody.json();
        context.respondJson(body, 201);
      });
      const response = await request(server.httpServer).post("/").send("???");
      expect(response.statusCode).toBe(201);
      expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
    });
  });

  describe("text", () => {
    it("should parse text", async () => {
      const requestData = "???";
      const server = createServer();
      server.use(async () => {
        const body = await context.requestBody.text();
        context.respondText(body, 201);
      });
      const response = await request(server.httpServer)
        .post("/")
        .send(requestData);
      expect(response.statusCode).toBe(201);
      expect(response.text).toBe(requestData);
    });
  });
});
