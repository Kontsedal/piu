import { AsyncLocalStorage } from "async_hooks";
import * as http from "http";
import { bodyParsers } from "./body-parsers";

const asyncStorage = new AsyncLocalStorage<Map<Symbol, unknown>>();

const runWithContext = (fn: () => unknown) => {
  const context = new Map();
  asyncStorage.run(context, fn);
};

const getContext = () => {
  return asyncStorage.getStore();
};

const setContextValue = (key: Symbol, value: unknown) => {
  const context = getContext();
  context?.set(key, value);
};

const getContextValue = <Value extends any>(key: Symbol) => {
  const context = getContext();
  return context?.get(key) as Value | void;
};

const [getRequestObject, setRequestObject] =
  createContextGetterSetter<http.IncomingMessage>(Symbol("request"));

const [getResponseObject, setResponseObject] =
  createContextGetterSetter<http.ServerResponse>(Symbol("response"));
const [getStatusCode, setStatusCode] = createContextGetterSetter<number>(
  Symbol("responseStatusCode")
);
const [getRequestId, setRequestId] = createContextGetterSetter<string>(
  Symbol("requestId")
);
const [getResponseBody, setResponseBody] = createContextGetterSetter<any>(
  Symbol("responseBody")
);
const [getResponseHeaders, setResponseHeaders] = createContextGetterSetter<
  Map<string, string | string[]>
>(Symbol("responseHeaders"), new Map());
const setResponseHeader = (key: string, value: string | string[]) => {
  const headers = getResponseHeaders();
  headers?.set(key, value);
};

const respondJson = (body: Record<string, unknown>, statusCode?: number) => {
  setResponseBody(JSON.stringify(body));
  typeof statusCode == "number" && setStatusCode(statusCode);
  setResponseHeader("Content-Type", "application/json");
};

const respondText = (
  body: string | number | undefined,
  statusCode?: number
) => {
  setResponseBody(body);
  typeof statusCode == "number" && setStatusCode(statusCode);
  setResponseHeader("Content-Type", "plain/text");
};
function createContextGetterSetter<Value extends any>(
  key: Symbol,
  defaultValue?: Value
) {
  return [
    () => (getContextValue<Value>(key) || defaultValue) as Value,
    (value: Value) => setContextValue(key, value) as Value,
  ] as const;
}

export const getRequestBodyJson = async () => {
  return await bodyParsers.getJsonRequestBody(getRequestObject());
};

export const getRequestBodyText = async () => {
  return await bodyParsers.getTextRequestBody(getRequestObject());
};

export const context = {
  runWithContext,
  getContext,
  getContextValue,
  getRequestObject,
  setRequestObject,
  getResponseObject,
  setResponseObject,
  getStatusCode,
  setStatusCode,
  getRequestId,
  setRequestId,
  getResponseBody,
  setResponseBody,
  getResponseHeaders,
  setResponseHeaders,
  setResponseHeader,
  respondJson,
  respondText,
  createContextGetterSetter,
  requestBody: {
    json: getRequestBodyJson,
    text: getRequestBodyText,
  },
};
