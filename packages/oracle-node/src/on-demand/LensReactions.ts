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

export async function fetchLensLikesByPostId(postId: string): Promise<number> {
    const state = await fetchStateFromDreNode();

    console.log(JSON.stringify(state, undefined, 4))

    const post = state[postId];



    if (post === undefined) {
        return 0;
    }

    const score = post.likes;

    return score;
}


async function fetchStateFromDreNode(): Promise<DreReactionStateResponse["state"]> {
    const { dreNodeUrl, reactionsContract } = getConfig();

    const { data } = await axios.get<DreReactionStateResponse>(dreNodeUrl + "contract", {
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
