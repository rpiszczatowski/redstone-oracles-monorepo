import fs from "fs";
import { BaseFetcher } from "../BaseFetcher";
import { PricesObj } from "../../types";
import { config } from "../../config";

export class MockFetcher extends BaseFetcher {
  private mockedPrices: PricesObj[];
  private counter: number;
  private maxRandomPrice: number;

  constructor() {
    super("mock-fetcher");
    this.mockedPrices = [];
    this.counter = 0;
    this.loadPricesFromFile(config.mockedPricesDataPath);
    this.maxRandomPrice = 100;
  }

  loadPrices(prices: PricesObj[]) {
    this.mockedPrices = prices;
    this.counter = 0;
  }
  loadPricesFromFile(path: string) {
    if (fs.existsSync(path)) {
      this.mockedPrices = JSON.parse(fs.readFileSync(path, "utf8"));
    }
  }

  getRandomPrices(ids: string[]): { [id: string]: number } {
    let result = {};
    ids.forEach((id) => {
      result = {
        ...result,
        [id]: Math.floor(Math.random() * this.maxRandomPrice),
      };
    });
    return result;
  }

  getNextPrice(ids: string[]): { [id: string]: number } {
    if (this.counter >= this.mockedPrices.length) {
      return this.getRandomPrices(ids);
    }
    let price = this.mockedPrices[this.counter];

    price = Object.keys(price)
      .filter((key) => ids.includes(key))
      .reduce((cur, key) => {
        return Object.assign(cur, { [key]: price[key] });
      }, {});

    this.counter++;
    return price;
  }

  setNextPrices(nextPrices: { [id: string]: number }) {
    this.counter = 0;
    this.mockedPrices = [nextPrices];
  }

  async fetchData(ids: string[]) {
    return this.getNextPrice(ids);
  }

  async extractPrices(response: any): Promise<PricesObj> {
    return response;
  }
}
