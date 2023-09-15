import axios from "axios";

export default {
  async executeQuery<T>(subgraphUrl: string, query: string): Promise<T> {
    const response = await axios.post(subgraphUrl, { query });
    return response.data as T;
  },
};
