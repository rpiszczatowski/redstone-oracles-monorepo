import { BaseFetcher } from "../BaseFetcher";
import { PricesObj as ReputationObject } from "../../types";
import graphProxy from "../../utils/graph-proxy";

const LENS_GRAPHQL_URL = "https://api.lens.dev/";

export class LensFetcher extends BaseFetcher {
  constructor() {
    super("lens");
  }

  // https://docs.lens.xyz/docs/recommended-profiles
  async fetchData() {
    const query = `query Profile {
      recommendedProfiles {
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
    }`;

    return await graphProxy.executeQuery(LENS_GRAPHQL_URL, query);
  }

  validateResponse(response: any): boolean {
    return response !== undefined && response.data !== undefined;
  }

  async extractPrices(response: any): Promise<ReputationObject> {
    const reputationObject: { [symbol: string]: number } = {};

    for (const profile of response.data.recommendedProfiles) {
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
        totalFollowers +
        totalPosts +
        totalComments +
        totalMirrors +
        totalPublications +
        totalCollects;
      reputationObject[symbol] = reputation;
    }

    return reputationObject;
  }
}
