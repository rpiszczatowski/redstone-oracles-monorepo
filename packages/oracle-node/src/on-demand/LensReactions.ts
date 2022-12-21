import axios from "axios";
import { config } from "../config";

enum ContractStatus {
    OK = "evaluated",
}

type ReactionsState = {
    [postId: string]: {
        likes: number;
        dislikes: number;
        voters: string[];
    }
}

type FollowState = {
    [profileId: string]: {
        following: string[],
        followers: string[]
    }
}

type DreReactionStateResponse<S> = {
    state: S,
    status: ContractStatus
};

export enum LensFollowRelation {
    NoRelation = 0,
    FirstFollowSecond = 1,
    SecondFollowFirst = 2,
    MutualFollow = 3
}

export async function fetchLensLikesByPostId(postId: string): Promise<number> {
    const { dreNodeUrl, lensContract } = getConfig();
    const state = await fetchStateFromDreNode<ReactionsState>(lensContract, dreNodeUrl);

    const post = state[postId];

    if (post === undefined) {
        return 0;
    }

    const score = post.likes;

    return score;
}


export async function fetchFollowRelationBetweenProfiles(firstProfileId: string, secondProfileId: string): Promise<LensFollowRelation> {
    const { dreNodeUrl, lensContract } = getConfig();

    const state = await fetchStateFromDreNode<FollowState>(lensContract, dreNodeUrl);

    const firstProfile = state[firstProfileId];

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


async function fetchStateFromDreNode<S>(contractAddress: string, dreNodeUrl: string): Promise<S> {
    const { data } = await axios.get<DreReactionStateResponse<S>>(dreNodeUrl + "contract", {
        params: {
            id: contractAddress,
            state: true
        }
    });

    if (data.status !== ContractStatus.OK) { throw new Error(`State wasn't evaluated`) }

    return data.state;
}


const getConfig = () => {
    const { warp } = config;
    if (!warp || !warp.dreNodeUrl || !warp.lensContract) {
        throw new Error("Warp not configured!")
    }
    return { ...warp };
};
