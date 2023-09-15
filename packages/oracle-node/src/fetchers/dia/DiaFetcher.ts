import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";
import axios, { AxiosResponse } from "axios";

const DIA_BASE_URL = "https://api.diadata.org/v1";
const DIA_QUOTATION_PATH = "quotation";

interface Quotation {
  Symbol: string;
  Price: number;
}

export class DiaFetcher extends MultiRequestFetcher {
  constructor() {
    super("dia");
  }

  override makeRequest(id: string): Promise<AxiosResponse<Quotation>> {
    return axios.get(`${DIA_BASE_URL}/${DIA_QUOTATION_PATH}/${id}`);
  }

  override extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse<AxiosResponse<Quotation | undefined>>
  ): number | undefined {
    return responses[dataFeedId]?.data?.Price;
  }
}
