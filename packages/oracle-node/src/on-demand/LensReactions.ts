import axios from "axios";
import { config } from "../config";

type PostReactions = {
    likes: number;
    dislikes: number;
    voters: string[];
}

type FollowProfile = {
    following: string[],
    followers: string[]
}

type DreKVResponse = {
    value: string,
};

export enum LensFollowRelation {
    NoRelation = 0,
    FirstFollowSecond = 1,
    SecondFollowFirst = 2,
    MutualFollow = 3
}

export async function fetchLensLikesByPostId(postId: string): Promise<number> {
    const { dreNodeUrl, lensContract } = getConfig();
    const post = await fetchStorageValueFromDre<PostReactions>(`reactions:${postId}`, lensContract, dreNodeUrl);

    if (!post) {
        return 0;
    }

    const score = post.likes;

    return score;
}


export async function fetchFollowRelationBetweenProfiles(firstProfileId: string, secondProfileId: string): Promise<LensFollowRelation> {
    const { dreNodeUrl, lensContract } = getConfig();

    const firstProfile = await fetchStorageValueFromDre<FollowProfile>(`follows:${firstProfileId}`, lensContract, dreNodeUrl);

    if (!firstProfile) {
        return LensFollowRelation.NoRelation;
    }

    const isFirstFollowingSecond = firstProfile.following.includes(secondProfileId);
    const isSecondFollowingFirst = firstProfile.followers.includes(secondProfileId);

    if (isFirstFollowingSecond && isSecondFollowingFirst) {
        return LensFollowRelation.MutualFollow;
    }

    if (isFirstFollowingSecond) {
        return LensFollowRelation.FirstFollowSecond;
    }

    if (isSecondFollowingFirst) {
        return LensFollowRelation.SecondFollowFirst;
    }

    return LensFollowRelation.NoRelation;
}


async function fetchStorageValueFromDre<S>(key: string, contractAddress: string, dreNodeUrl: string): Promise<S | null> {
    const { data } = await axios.get<DreKVResponse>(dreNodeUrl + "kv", {
        params: {
            id: contractAddress,
            keys: key
        }
    });

    const values = new Map(JSON.parse(data.value));

    if (!values.has(key)) {
        return null;
    }

    return JSON.parse(values.get(key) as string);
}


const getConfig = () => {
    const { warp } = config;
    if (!warp || !warp.dreNodeUrl || !warp.lensContract) {
        throw new Error("Warp not configured!")
    }
    return { ...warp };
};
