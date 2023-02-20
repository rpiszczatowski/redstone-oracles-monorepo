import { PricesObj } from "../src/types";
import { MultiRequestFetcher } from "../src/fetchers/MultiRequestFetcher";

describe("MultiRequestFetcher", () => {
  const expectedResult = [
    { symbol: "100", value: 10000 },
    { symbol: "200", value: 20000 },
    { symbol: "300", value: 30000 },
  ];

  it("should properly prepare request and process data with different promise results", async () => {
    // given

    const sut = new MultiRequestFetcherMock();

    // when

    const pricesObj = await sut.fetchAll([
      "100",
      "Reject",
      "200",
      "Error",
      "300",
    ]);

    // then

    expect(pricesObj).toEqual(expectedResult);
  });
});

class MultiRequestFetcherMock extends MultiRequestFetcher {
  constructor() {
    super("mock");
  }

  makeRequest(id: string): Promise<any> {
    switch (id) {
      case "Reject":
        return Promise.reject();
      case "Error":
        return new Promise(() => {
          throw new Error("Whoops!");
        });
      default:
        return Promise.resolve({ data: { id: id, value: id } });
    }
  }

  getProcessingContext(): number {
    return 100;
  }

  processData(data: any, pricesObj: PricesObj, context?: number): PricesObj {
    if (context === undefined) {
      return pricesObj;
    }

    pricesObj[data.id] = data.value * context;

    return pricesObj;
  }
}
