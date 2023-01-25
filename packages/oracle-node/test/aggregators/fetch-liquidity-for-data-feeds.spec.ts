import axios from "axios";
import { fetchLiquidityForDataFeeds } from "../../src/aggregators/lwap/fetch-liquidity-for-data-feeds";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("fetchLiquidityForDataFeeds", () => {
  test("should throw error if NaN in fetched liquidity", async () => {
    mockedAxios.post.mockResolvedValue(liquidityWithUndefined);
    await expect(fetchLiquidityForDataFeeds(prices)).rejects.toThrowError(
      "Cannot get LWAP value form an liquidity array that contains NaN value"
    );
  });

  test("should throw error if error value in fetched liquidity", async () => {
    mockedAxios.post.mockResolvedValue(liquidityWithError);
    await expect(fetchLiquidityForDataFeeds(prices)).rejects.toThrowError(
      "Cannot get LWAP value form an liquidity array that contains NaN value"
    );
  });

  test("should throw error if errors from subgraph", async () => {
    mockedAxios.post.mockResolvedValue(liquidityWithErrors);
    await expect(fetchLiquidityForDataFeeds(prices)).rejects.toThrowError(
      "Cannot get LWAP value from an liquidity array that is empty"
    );
  });

  test("should fetch liquidity for data feeds", async () => {
    mockedAxios.post.mockResolvedValueOnce(liquidityFromTraderJoe);
    mockedAxios.post.mockResolvedValueOnce(liquidityFromUniswap);
    mockedAxios.post.mockResolvedValueOnce(liquidityFromSushiswap);
    mockedAxios.post.mockResolvedValueOnce(liquidityFromPangolin);
    const result = await fetchLiquidityForDataFeeds(prices);
    expect(result).toEqual({
      "pangolin-wavax": {
        PNG: 1342545.432,
      },
      sushiswap: {
        AAVE: 753432.431232,
      },
      "trader-joe": {
        JOE: 432454.432,
        PNG: 13443.432,
      },
      uniswap: {
        AAVE: 653543.44534332,
      },
    });
  });
});

const prices = [
  {
    id: "",
    source: {
      "trader-joe": 4.6546,
    },
    symbol: "PNG",
    timestamp: 0,
    version: "",
  },
  {
    id: "",
    source: {
      "trader-joe": 14.433,
    },
    symbol: "JOE",
    timestamp: 0,
    version: "",
  },
  {
    id: "",
    source: {
      uniswap: 7,
      sushiswap: 7.6,
    },
    symbol: "AAVE",
    timestamp: 0,
    version: "",
  },
  {
    id: "",
    source: {
      "pangolin-wavax": 3.23,
    },
    symbol: "PNG",
    timestamp: 0,
    version: "",
  },
];

const liquidityWithUndefined = {
  data: {
    data: {
      pairs: [
        {
          id: "0x3daf1c6268362214ebb064647555438c6f365f96",
          reserveUSD: undefined,
        },
      ],
    },
  },
};

const liquidityWithError = {
  data: {
    data: {
      pairs: [
        {
          id: "0x3daf1c6268362214ebb064647555438c6f365f96",
          reserveUSD: "error",
        },
      ],
    },
  },
};

const liquidityWithErrors = {
  data: {
    data: {
      errors: ["error"],
    },
  },
};

const liquidityFromTraderJoe = {
  data: {
    data: {
      pairs: [
        {
          id: "0x454e67025631c065d3cfad6d71e6892f74487a15",
          reserveUSD: "432454.432",
        },
        {
          id: "0x3daf1c6268362214ebb064647555438c6f365f96",
          reserveUSD: "13443.432",
        },
      ],
    },
  },
};

const liquidityFromPangolin = {
  data: {
    data: {
      pairs: [
        {
          id: "0xd7538cabbf8605bde1f4901b47b8d42c61de0367",
          reserveUSD: "1342545.432",
        },
      ],
    },
  },
};

const liquidityFromUniswap = {
  data: {
    data: {
      pairs: [
        {
          id: "0xdfc14d2af169b0d36c4eff567ada9b2e0cae044f",
          reserveUSD: "653543.44534332",
        },
      ],
    },
  },
};

const liquidityFromSushiswap = {
  data: {
    data: {
      pairs: [
        {
          id: "0xd75ea151a61d06868e31f8988d28dfe5e9df57b4",
          reserveUSD: "753432.431232",
        },
      ],
    },
  },
};
