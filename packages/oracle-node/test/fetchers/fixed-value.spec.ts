import { FixedValueFetcher } from "../../src/fetchers/fixed-value-fetcher/fixed-value-fetcher";
import { Manifest } from "../../src/types";

describe("mock fetcher", () => {
  const sut = new FixedValueFetcher();

  test("should properly fetch data from URL", async () => {
    const result = await sut.fetchAll(["USDf"], {
      manifest: {
        tokens: {
          USDf: {
            fixedValue: 1,
          },
        },
      } as unknown as Manifest,
    });

    expect(result).toEqual([
      {
        symbol: "USDf",
        value: 1,
      },
    ]);
  });
});
