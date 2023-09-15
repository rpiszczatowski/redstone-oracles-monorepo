import { BaseFetcher } from "../BaseFetcher";
import { PricesObj as ReputationObject } from "../../types";
import graphProxy from "../../utils/graph-proxy";

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

type LensResponse = {
  data: {
    profiles: {
      items: LensProfile[];
    };
  };
};

const LENS_GRAPHQL_URL = "https://api.lens.dev/";

export class LensFetcher extends BaseFetcher {
  constructor() {
    super("lens");
  }

  static async fetchDataFromLens(ids: string[]) {
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

    return await graphProxy.executeQuery<LensResponse>(LENS_GRAPHQL_URL, query);
  }

  override async fetchData(ids: string[]) {
    const maxLensQueryResponseCount = 50;
    const pagesCount = Math.floor(ids.length / maxLensQueryResponseCount) + 1;
    const profiles: LensProfile[] = [];
    for (const pageNumber of [...Array(pagesCount).keys()]) {
      const slicedIds = ids.slice(
        pageNumber * maxLensQueryResponseCount,
        pageNumber * maxLensQueryResponseCount + maxLensQueryResponseCount
      );
      const response = await LensFetcher.fetchDataFromLens(slicedIds);
      profiles.push(...response.data.profiles.items);
    }
    return profiles;
  }

  override validateResponse(profiles: LensProfile[] | undefined): boolean {
    return profiles !== undefined && profiles.length > 0;
  }

  override extractPrices(profiles: LensProfile[]): ReputationObject {
    return this.extractPricesSafely(profiles, (profile) =>
      LensFetcher.extractReputation(profile)
    );
  }

  private static extractReputation(profile: LensProfile) {
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
    return { value: reputation, id: symbol };
  }
}
