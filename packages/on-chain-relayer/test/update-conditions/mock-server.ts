import { setupServer } from "msw/node";
import { rest } from "msw";
import { mockNewYorkFedResponse } from "../helpers";

const handlers = [
  rest.get(
    "https://markets.newyorkfed.org/api/rates/all/latest.json",
    async (req, res, ctx) => {
      return res(ctx.json(mockNewYorkFedResponse));
    }
  ),
];

export const invalidHandlers = [
  rest.get(
    "https://markets.newyorkfed.org/api/rates/all/latest.json",
    async (req, res, ctx) => {
      return res.networkError("Failed to fetch");
    }
  ),
];

export const server = setupServer(...handlers);
