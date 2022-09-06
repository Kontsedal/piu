import { createServer } from "../server";
import request from "supertest";
import { context } from "../context";

describe("server", () => {
  it("should respond 404 with no middlewares", async () => {
    const server = createServer();
    const response = await request(server.httpServer).get("/").send();
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchObject({ message: "Not found" });
  });

  it("should respond with a middleware answer", async () => {
    const responseObj = { test: 1 };
    const server = createServer();
    server.use(() => {
      context.respondJson(responseObj, 201);
    });
    const response = await request(server.httpServer).get("/").send();
    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject(responseObj);
  });

  it("should respond with 500 on error", async () => {
    let error = "Ooopsie";
    const server = createServer();
    server.use(() => {
      throw new Error(error);
    });
    const response = await request(server.httpServer).get("/").send();
    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchObject({ message: error });
  });

  it("should respect a custom error handler", async () => {
    const customError = { error: "Custom error" };
    const server = createServer({
      onError: (error) => {
        context.respondJson({ error: "Custom error" }, 501);
      },
    });
    server.use(() => {
      throw new Error("???why");
    });
    const response = await request(server.httpServer).get("/").send();
    expect(response.statusCode).toBe(501);
    expect(response.body).toMatchObject(customError);
  });
});
