import exampleResponse from "./example-response.json";

const transactionNotFromCoinbase = {
  from: "0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5",
  to: "0x473780deaf4a2ac070bbba936b0cdefe7f267dfc",
  value: "1324545",
} as any;

export const getResponseWithOuterTransaction = () => {
  const mockedResponse = { result: [] as any[] };
  mockedResponse.result = [
    ...exampleResponse.result,
    transactionNotFromCoinbase,
  ];
  return mockedResponse;
};

export const getSlicedResponseWithOuterTransaction = () => {
  const mockedResponse = { result: [] as any[] };
  mockedResponse.result = exampleResponse.result.slice(0, 3);
  mockedResponse.result = [
    ...mockedResponse.result,
    transactionNotFromCoinbase,
  ];
  return mockedResponse;
};

export const getMultipliedResponse = () => {
  const multipliedResponse: any[] = [];
  [...new Array(1000).keys()].forEach(() =>
    multipliedResponse.push(...exampleResponse.result)
  );

  return multipliedResponse;
};

export const getRateLimitedResponse = () => ({
  status: "0",
  message: "NOTOK",
  result: "Max rate limit reached, please use API Key for higher rate limit",
});
