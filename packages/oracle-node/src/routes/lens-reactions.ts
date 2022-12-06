import express from "express";
import { Consola } from "consola";
import {
    signOnDemandDataPackage,
} from "redstone-protocol";
import { NodeConfig } from "../types";
import { stringifyError } from "../utils/error-stringifier";
import * as LensReactions from "./lens-reactions";
import { fetchLensReactionsByPostId } from "../on-demand/LensReactions";

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

    const score = await fetchLensReactionsByPostId(postId);

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

    return signOnDemandDataPackage(postId, score, timestamp, privateKey);
};
