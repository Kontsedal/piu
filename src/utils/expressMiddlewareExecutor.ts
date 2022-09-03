import * as http from "http";
import * as context from "../context";
import {
  createReadonlyProxy,
  createSuperProxy,
  SuperProxyResult,
} from "./proxy";

export const executeExpressMiddleware = (
  middleware: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: (error?: any) => unknown
  ) => unknown
): Promise<{
  responseChanges: SuperProxyResult;
  requestChanges: Record<string, any>;
}> => {
  const fakeResponse = createSuperProxy();
  const fakeRequest = createReadonlyProxy(context.getRequestObject());
  return new Promise((resolve, reject) => {
    middleware(
      fakeRequest.proxy as unknown as http.IncomingMessage,
      fakeResponse.proxy as unknown as http.ServerResponse,
      async (error) => {
        if (error) {
          return reject(error);
        }
        resolve({
          responseChanges: fakeResponse.changes,
          requestChanges: fakeRequest.changes,
        });
      }
    );
  });
};
