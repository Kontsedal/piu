import { AsyncLocalStorage } from "async_hooks";
import * as http from "http";

export const asyncStorage = new AsyncLocalStorage<Map<Symbol, unknown>>();

export const runWithContext = (fn: () => unknown) => {
  const context = new Map();
  asyncStorage.run(context, fn);
};

export const getContext = () => {
  return asyncStorage.getStore();
};

export const setContextValue = (key: Symbol, value: unknown) => {
  const context = getContext();
  context?.set(key, value);
};

export const getContextValue = <Value extends any>(key: Symbol) => {
  const context = getContext();
  return context?.get(key) as Value | void;
};

export const [getRequestObject, setRequestObject] =
  createGetterSetter<http.IncomingMessage>(Symbol("request"));

export const [getResponseObject, setResponseObject] =
  createGetterSetter<http.ServerResponse>(Symbol("response"));
export const [getStatusCode, setStatusCode] = createGetterSetter<number>(
  Symbol("responseStatusCode")
);
export const [getRequestId, setRequestId] = createGetterSetter<string>(
  Symbol("requestId")
);
export const [getResponseBody, setResponseBody] = createGetterSetter<any>(
  Symbol("responseBody")
);
export const [getResponseHeaders, setResponseHeaders] = createGetterSetter<
  Map<string, string | string[]>
>(Symbol("responseHeaders"), new Map());
export const setResponseHeader = (key: string, value: string | string[]) => {
  const headers = getResponseHeaders();
  headers?.set(key, value);
};

export const respondJson = (
  body: Record<string, unknown>,
  statusCode?: number
) => {
  setResponseBody(JSON.stringify(body));
  typeof statusCode == "number" && setStatusCode(statusCode);
  setResponseHeader("Content-Type", "application/json");
};
export function createGetterSetter<Value extends any>(
  key: Symbol,
  defaultValue?: Value
) {
  return [
    () => (getContextValue<Value>(key) || defaultValue) as Value,
    (value: Value) => setContextValue(key, value) as Value,
  ] as const;
}
