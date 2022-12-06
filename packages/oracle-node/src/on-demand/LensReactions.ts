import axios from "axios";
import { config } from "../config";

enum ContractStatus {
    OK = "evaluated",
}

type DreReactionStateResponse = {
    state: {
        [postId: string]: {
            likes: number;
            dislikes: number;
            voters: string[];
        }
    },
    status: ContractStatus
};

export async function fetchLensReactionsByPostId(postId: string): Promise<number> {
    const state = await fetchStateFromDreNode();

    const post = state[postId];

    if (post === undefined) {
        throw new Error(`Post ${postId} not found`);
    }

    const score = post.likes - post.dislikes;

    return score;
}


async function fetchStateFromDreNode(): Promise<DreReactionStateResponse["state"]> {
    const { dreNodeUrl, reactionsContract } = getConfig();

    const { data } = await axios.get<DreReactionStateResponse>(dreNodeUrl, {
        params: {
            id: reactionsContract,
            state: true
        }
    });

    if (data.status !== ContractStatus.OK) { throw new Error(`State wasn't evaluated`) }

    return data.state;
}


const getConfig = () => {
    const { warp } = config;
    if (!warp || !warp.dreNodeUrl || !warp.reactionsContract) {
        throw new Error("Warp not configured!")
    }
    return { ...warp };
};
