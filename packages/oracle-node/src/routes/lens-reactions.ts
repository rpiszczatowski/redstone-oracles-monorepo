import express from "express";
import { Consola } from "consola";
import {
    signOnDemandDataPackage,
} from "redstone-protocol";
import { NodeConfig } from "../types";
import { stringifyError } from "../utils/error-stringifier";
import * as LensReactions from "./lens-reactions";
import { fetchLensLikesByPostId } from "../on-demand/LensReactions";
import { utils } from "ethers";

const logger = require("../utils/logger")("lens-reactions-by-post") as Consola;

interface RequestParams {
    postId: string;
}

export const setLensReactionRoute = (
    app: express.Application,
    nodeConfig: NodeConfig
) => {
    app.get("/lens-reactions", async (req, res) => {
        try {
            logger.info("Request lens reactions");
            const params = req.query as unknown as RequestParams;
            const { postId } = params;
            validateRequestParams(postId);

            const currentTimestamp = new Date().getTime();

            const signedDataPackage = await getSignedDataPackage(
                currentTimestamp,
                nodeConfig.privateKeys.ethereumPrivateKey,
                postId
            );

            return res.json(signedDataPackage.toObj());
        } catch (error: any) {
            const errText = stringifyError(error.message);
            res.status(400).json({
                error: errText,
            });
        }
    });
};

const validateRequestParams = (
    postId: string
) => {
    if (!(postId)) {
        throw new Error(`Invalid request, missing query parameter "postId"`);
    }
};

export const fetchReactions = async (
    postId: string
): Promise<number> => {
    logger.info(`Fetching lens reactions for post: ${postId}`);

    const score = await fetchLensLikesByPostId(postId);

    logger.info(
        `Fetched score data for post ${postId}, computed score: ${score} `
    )

    return score;
};

const getSignedDataPackage = async (
    timestamp: number,
    privateKey: string,
    postId: string
) => {
    const score = await LensReactions.fetchReactions(postId);

    return signOnDemandDataPackage(extractDataFeedIdFromPost(postId), score, timestamp, privateKey);
};

const extractDataFeedIdFromPost = (postId: string) => {
    const [profileId, pubId] = postId.split("-");

    if (!profileId || !pubId) {
        throw Error(`Wrong format of postId "${postId}", should be "hexString-hexString"`)
    }

    return utils.hexZeroPad(pubId, 32);
}
