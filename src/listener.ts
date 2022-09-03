import * as http from "http";
import * as crypto from "crypto";
import * as context from "./context";

export type Middleware = (next: () => unknown) => unknown;

export type CreateListenerParams = {
  onError?: (error: Error) => unknown;
  httpServerOptions?: http.ServerOptions;
};

export function createListener(options?: CreateListenerParams) {
  const middlewares: Middleware[] = [];
  const httpServer = http.createServer(
    options?.httpServerOptions ?? {},
    async (req: http.IncomingMessage, res: http.ServerResponse) => {
      handleRequest({ req, res, options, middlewares });
    }
  );

  return {
    use: (middleware: Middleware) => middlewares.push(middleware),
    httpServer,
  };
}

function handleRequest({
  req,
  res,
  options,
  middlewares,
}: {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  options?: CreateListenerParams;
  middlewares: Middleware[];
}) {
  context.runWithContext(async () => {
    context.setRequestId(crypto.randomUUID());
    try {
      try {
        return executeMiddlewares(middlewares);
      } catch (error: any) {
        if (typeof options?.onError === "function") {
          await options?.onError(error);
        }
      }
    } catch (error) {
      if (!context.getStatusCode()) {
        context.setStatusCode(500);
      }
      if (!context.getResponseBody()) {
        context.setResponseBody(error);
      }
    } finally {
      if (!context.getResponseBody() && !context.getStatusCode()) {
        context.respondJson({ message: "Not found" }, 404);
      }
      res.statusCode = context.getStatusCode() || 200;
      context.getResponseHeaders()?.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.end(context.getResponseBody());
    }
  });
}

export async function executeMiddlewares(middlewares: Middleware[]) {
  if (middlewares.length == 0) {
    return;
  }
  let middlewareNumber = 0;
  await middlewares[0](nextMiddleware);
  function nextMiddleware() {
    middlewareNumber++;
    const middleware = middlewares[middlewareNumber];
    if (middleware) {
      return middleware(nextMiddleware);
    }
  }
}
