import { setupServer } from "msw/node";
import { rest } from "msw";
import { mockSignedDataPackageObj } from "../tests-common";

const singedDataPackageObj = mockSignedDataPackageObj;

const handlers = [
  rest.get(
    "http://valid-cache.com/data-packages/latest",
    async (req, res, ctx) => {
      return res(
        ctx.json({
          ETH: singedDataPackageObj.filter(
            (obj) =>
              obj.dataPoints.filter((dp) => dp.dataFeedId === "ETH").length > 0
          ),
          BTC: singedDataPackageObj.filter(
            (obj) =>
              obj.dataPoints.filter((dp) => dp.dataFeedId === "BTC").length > 0
          ),
        })
      );
    }
  ),
  rest.get(
    "http://invalid-cache.com/data-packages/latest",
    async (req, res, ctx) => {
      return res(
        ctx.json({
          ETH: singedDataPackageObj
            .filter(
              (obj) =>
                obj.dataPoints.filter((dp) => dp.dataFeedId === "ETH").length >
                0
            )
            .map((obj) => ({ ...obj, timestampMilliseconds: 1654353411111 })),
          BTC: singedDataPackageObj
            .filter(
              (obj) =>
                obj.dataPoints.filter((dp) => dp.dataFeedId === "BTC").length >
                0
            )
            .map((obj) => ({ ...obj, timestampMilliseconds: 1654353411111 })),
        })
      );
    }
  ),
  rest.get(
    "http://slower-cache.com/data-packages/latest",
    async (req, res, ctx) => {
      return res(
        ctx.delay(200),
        ctx.json({
          ETH: singedDataPackageObj.filter(
            (obj) =>
              obj.dataPoints.filter((dp) => dp.dataFeedId === "ETH").length > 0
          ),
          BTC: singedDataPackageObj.filter(
            (obj) =>
              obj.dataPoints.filter((dp) => dp.dataFeedId === "BTC").length > 0
          ),
        })
      );
    }
  ),
];

export const server = setupServer(...handlers);
