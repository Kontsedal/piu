import { createServer } from "../server";
import bodyParser from "body-parser";
import { respondJson, setResponseHeader } from "../context";
import request from "supertest";
import cors from "cors";
import { executeExpressMiddleware } from "../utils/expressMiddlewareExecutor";

describe("express middleware executor", () => {
  it("should support body parser express middleware", async () => {
    const server = createServer();
    server.use(async () => {
      const { requestChanges } = await executeExpressMiddleware(
        bodyParser.json()
      );
      respondJson(requestChanges.body, 201);
    });
    const response = await request(server.httpServer)
      .post("/")
      .send({ some: "data" });
    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({ some: "data" });
  });

  it("should support cors express middleware", async () => {
    const server = createServer();
    server.use(async () => {
      const { requestChanges, responseChanges } =
        await executeExpressMiddleware(cors());
      responseChanges.calls?.setHeader.forEach(([key, value]) => {
        setResponseHeader(key, value);
      });
      respondJson({ success: true }, 201);
    });
    const response = await request(server.httpServer)
      .post("/")
      .send({ some: "data" });
    expect(response.statusCode).toBe(201);
    expect(response.headers?.["access-control-allow-origin"]).toBe("*");
  });
});
