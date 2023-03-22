import { BaseFetcher } from "../BaseFetcher";
import { PricesObj as ReputationObject } from "../../types";
import graphProxy from "../../utils/graph-proxy";
import { stringifyError } from "../../utils/error-stringifier";

interface LensProfile {
  id: string;
  handle: string;
  stats: {
    totalFollowers: number;
    totalFollowing: number;
    totalPosts: number;
    totalComments: number;
    totalMirrors: number;
    totalPublications: number;
    totalCollects: number;
  };
}

const LENS_GRAPHQL_URL = "https://api.lens.dev/";

export class LensFetcher extends BaseFetcher {
  constructor() {
    super("lens");
  }

  async fetchDataFromLens(ids: string[]) {
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

  async fetchData(ids: string[]) {
    const maxLensQueryResponseCount = 50;
    const pagesCount = Math.floor(ids.length / maxLensQueryResponseCount) + 1;
    const profiles: LensProfile[] = [];
    for (const pageNumber of [...Array(pagesCount).keys()]) {
      const slicedIds = ids.slice(
        pageNumber * maxLensQueryResponseCount,
        pageNumber * maxLensQueryResponseCount + maxLensQueryResponseCount
      );
      const response = await this.fetchDataFromLens(slicedIds);
      profiles.push(...response.data.profiles.items);
    }
    return profiles;
  }

  validateResponse(profiles: LensProfile[]): boolean {
    return profiles !== undefined && profiles.length > 0;
  }

  extractPrices(profiles: LensProfile[]): ReputationObject {
    const reputationObject: ReputationObject = {};

    for (const profile of profiles) {
      try {
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
      } catch (error: any) {
        this.logger.error(
          `Extracting price failed for: ${profile?.handle}. ${stringifyError(
            error
          )}`
        );
      }
    }

    return reputationObject;
  }
}
