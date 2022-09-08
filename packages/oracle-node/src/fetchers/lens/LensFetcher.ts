import { BaseFetcher } from "../BaseFetcher";
import { PricesObj as ReputationObject } from "../../types";
import graphProxy from "../../utils/graph-proxy";

const LENS_GRAPHQL_URL = "https://api.lens.dev/";

export class LensFetcher extends BaseFetcher {
  constructor() {
    super("lens");
  }

  async fetchData(ids: string[]) {
    const query = `query Profiles {
      profiles(request: { handles: ${JSON.stringify(ids)}, limit: 50 }) {
        items {
          id
          handle
          stats {
            totalFollowers
            totalFollowing
            totalPosts
            totalComments
            totalMirrors
            totalPublications
            totalCollects
          } 
        }
      }
    }`;

    return await graphProxy.executeQuery(LENS_GRAPHQL_URL, query);
  }

  validateResponse(response: any): boolean {
    return response !== undefined && response.data !== undefined;
  }

  async extractPrices(response: any): Promise<ReputationObject> {
    const reputationObject: { [symbol: string]: number } = {};

    for (const profile of response.data.profiles.items) {
      const symbol = profile.handle;
      const {
        totalFollowers,
        totalPosts,
        totalComments,
        totalMirrors,
        totalPublications,
        totalCollects,
      } = profile.stats;
      const reputation =
        totalFollowers * 0.75 +
        totalPosts * 0.5 +
        totalComments * 0.25 +
        totalMirrors * 1 +
        totalPublications * 0.5 +
        totalCollects * 1;
      reputationObject[symbol] = reputation;
    }

    return reputationObject;
  }
}
