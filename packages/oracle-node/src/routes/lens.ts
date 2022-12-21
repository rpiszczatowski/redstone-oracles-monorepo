import express from "express";
import { Consola } from "consola";
import {
    signOnDemandDataPackage,
} from "redstone-protocol";
import { NodeConfig } from "../types";
import { stringifyError } from "../utils/error-stringifier";
import * as LensReactions from "./lens";
import { fetchFollowRelationBetweenProfiles, fetchLensLikesByPostId } from "../on-demand/LensReactions";
import { utils } from "ethers";

const logger = require("../utils/logger")("lens") as Consola;

interface LikeRequestParams {
    postId: string;
}

interface FollowersRequestParams {
    firstProfileId: string;
    secondProfileId: string;
}

export const setLensReactionRoute = (
    app: express.Application,
    nodeConfig: NodeConfig
) => {
    app.get("/lens/likes", async (req, res) => {
        try {
            logger.info("Request lens reactions");

            const params = req.query as unknown as LikeRequestParams;
            const { postId } = validateLikesRequestParams(params);

            const currentTimestamp = new Date().getTime();

            const score = await LensReactions.fetchLikes(postId);

            const signedDataPackage =
                signOnDemandDataPackage(
                    createDataFeedIdFromPost(postId),
                    score,
                    currentTimestamp,
                    nodeConfig.privateKeys.ethereumPrivateKey
                );


            return res.json(signedDataPackage.toObj());
        } catch (error: any) {
            const errText = stringifyError(error.message);
            res.status(400).json({
                error: errText,
            });
        }
    });

    app.get("/lens/follows", async (req, res) => {
        try {
            logger.info("Request lens follows");

            const params = req.query as unknown as FollowersRequestParams;
            const { firstProfileId, secondProfileId } = validateFollowersRequestParams(params);

            const currentTimestamp = new Date().getTime();
            const relation = await fetchFollowRelation(
                firstProfileId,
                secondProfileId
            );

            const signedDataPackage = await signOnDemandDataPackage(
                // todo: This has to be concatenation for two profiles
                utils.hexZeroPad(firstProfileId, 32),
                relation,
                currentTimestamp,
                nodeConfig.privateKeys.ethereumPrivateKey,
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


export const fetchFollowRelation = async (
    firstProfileId: string,
    secondProfileId: string
) => {
    logger.info(`Fetching lens follow relation between profiles: ${firstProfileId} and ${secondProfileId}`);

    const relation = await fetchFollowRelationBetweenProfiles(firstProfileId, secondProfileId);

    logger.info(`Fetched lens follow relation between profiles: ${firstProfileId} and ${secondProfileId}: ${relation}`);

    return relation;
}

export const fetchLikes = async (
    postId: string
): Promise<number> => {
    logger.info(`Fetching lens reactions for post: ${postId}`);

    const score = await fetchLensLikesByPostId(postId);

    logger.info(
        `Fetched score data for post ${postId}, computed score: ${score} `
    )

    return score;
};

const createDataFeedIdFromPost = (postId: string) => {
    const [profileId, pubId] = postId.split("-");

    if (!profileId || !pubId) {
        throw Error(`Wrong format of postId "${postId}", should be "hexString-hexString"`)
    }

    return utils.hexZeroPad(pubId, 32);
}

const validateFollowersRequestParams = (
    request: FollowersRequestParams
) => {
    console.log(request)
    if (!(request.firstProfileId) && !(request.secondProfileId)) {
        throw new Error(`Invalid request, missing query parameter "firstProfileId" or "secondProfileId"`);
    }
    return request;
}

const validateLikesRequestParams = (
    request: LikeRequestParams
) => {
    if (!(request.postId)) {
        throw new Error(`Invalid request, missing query parameter "postId"`);
    }
    return request;
};
