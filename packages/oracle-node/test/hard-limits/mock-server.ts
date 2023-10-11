import { rest } from "msw";
import { setupServer } from "msw/node";

export const mockedTimestamp = 1696502989194;

export const validResponse = {
  BTC: {
    lower: 16627.59098942572,
    upper: 38797.71230866001,
  },
  ETH: {
    lower: 983.9872183943954,
    upper: 2295.9701762535897,
  },
  __lastUpdatedTimestamp: mockedTimestamp,
};

const outdatedResponses = {
  ...validResponse,
  __lastUpdatedTimestamp: 1696420196000,
};

const firstUrl = "http://first-hard-limits-url";
const secondUrl = "http://second-hard-limits-url";
const thirdUrl = "http://third-hard-limits-url";

export const urls = [firstUrl, secondUrl, thirdUrl];

const allValidHandlers = [
  rest.get(firstUrl, (_, res, ctx) => res(ctx.json(validResponse))),
  rest.get(secondUrl, (_, res, ctx) => res(ctx.json(validResponse))),
  rest.get(thirdUrl, (_, res, ctx) => res(ctx.json(validResponse))),
];

export const secondValid = [
  rest.get(firstUrl, (_, res, ctx) => res(ctx.status(400))),
  rest.get(secondUrl, (_, res, ctx) => res(ctx.json(validResponse))),
  rest.get(thirdUrl, (_, res, ctx) => res(ctx.json(validResponse))),
];

export const thirdValid = [
  rest.get(firstUrl, (_, res, ctx) => res(ctx.status(400))),
  rest.get(secondUrl, (_, res, ctx) => res(ctx.status(400))),
  rest.get(thirdUrl, (_, res, ctx) => res(ctx.json(validResponse))),
];

export const firstOutdated = [
  rest.get(firstUrl, (_, res, ctx) => res(ctx.json(outdatedResponses))),
  rest.get(secondUrl, (_, res, ctx) => res(ctx.json(validResponse))),
  rest.get(thirdUrl, (_, res, ctx) => res(ctx.json(validResponse))),
];

export const allInvalid = [
  rest.get(firstUrl, (_, res, ctx) => res(ctx.status(400))),
  rest.get(secondUrl, (_, res, ctx) => res(ctx.status(400))),
  rest.get(thirdUrl, (_, res, ctx) => res(ctx.status(400))),
];

export const server = setupServer(...allValidHandlers);
