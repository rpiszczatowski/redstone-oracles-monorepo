import { BaseFetcher } from "../BaseFetcher";
import { PricesObj as ReputationObject } from "../../types";
import graphProxy from "../../utils/graph-proxy";

const LENS_GRAPHQL_URL = "https://api.lens.dev/";

export class LensFetcher extends BaseFetcher {
  constructor() {
    super("lens");
  }

  async fetchData() {
    const query = `query Profiles {
      profiles(request: { handles: [
        "lensprotocol",
        "aaveaave.lens",
        "aavegrants.lens",
        "letsraave.lens",
        "stani.lens",
        "wagmi.lens",
        "wassim.lens",
        "donosonaumczuk.lens",
        "nicolo.lens",
        "jouni.lens"
      ], limit: 10 }) {
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
