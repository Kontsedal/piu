import * as http from "http";

const getRequestBodyBuffer = (req: http.IncomingMessage): Promise<Buffer> => {
  const result: Buffer[] = [];
  return new Promise((resolve, reject) => {
    req.on("data", (data) => {
      result.push(data);
    });
    req.on("end", () => {
      resolve(Buffer.concat(result));
    });
    req.on("error", reject);
  });
};

const getJsonRequestBody = async (req: http.IncomingMessage) => {
  const buffer = await getRequestBodyBuffer(req);
  try {
    return JSON.parse(buffer.toString());
  } catch {
    return {};
  }
};

const getTextRequestBody = async (req: http.IncomingMessage) => {
  const buffer = await getRequestBodyBuffer(req);
  try {
    return buffer.toString();
  } catch (error) {
    return undefined;
  }
};

export const bodyParsers = {
  getRequestBodyBuffer,
  getJsonRequestBody,
  getTextRequestBody,
};
