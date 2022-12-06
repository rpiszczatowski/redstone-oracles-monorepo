import { getApp } from "./_helpers";
import { Express } from "express";
import request from 'supertest';
import { Wallet } from 'ethers';
import { prepareMessageToSign, UniversalSigner } from "redstone-protocol";
import { hexZeroPad } from "ethers/lib/utils";

jest.mock("../../src/routes/lens-reactions.ts", () => ({
    ...jest.requireActual("../../src/routes/lens-reactions.ts"),
    fetchReactions: () => Promise.resolve(100) // 100 likes 
}))

const mockedTimestamp = 1666082293466;
jest.useFakeTimers().setSystemTime(mockedTimestamp);

describe("Lens reactions on demand request", () => {
    let app: Express;
    let timestamp: number;
    let signature: string;

    beforeAll(async () => {
        ({ timestamp, signature } = await getQueryParams());
    });

    beforeEach(() => {
        app = getApp();
    });

    const getLensReactions = async (postId: string) => {
        const response = await request(app)
            .get("/lens-reactions")
            .query({
                timestamp,
                signature,
                postId: postId
            });
        return response;
    }

    it("Should return correct response", async () => {
        const postId = "0x01-0x02";
        const response = await getLensReactions(postId);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            signature: expect.any(String),
            dataPoints: [{
                dataFeedId: hexZeroPad("0x02", 32),
                value: 100,
                decimals: 0
            }],
            timestampMilliseconds: mockedTimestamp
        });
    });

    it("Should fail on missing postId", async () => {
        const postId = undefined as unknown as string;
        const response = await getLensReactions(postId);

        expect(response.statusCode).toBe(400);
    });

    it("Should fail on missing postId", async () => {
        const postId = undefined as unknown as string;
        const response = await getLensReactions(postId);

        expect(response.statusCode).toBe(400);
    });

});

const getQueryParams = async () => {
    const timestamp = new Date().getTime();
    const signer = new Wallet(
        "0xd14d1c078c6219fe2ed6e02c05b4a376f8161a05255611aa8d5e39ee06d0bc4e"
    );
    const message = prepareMessageToSign(timestamp);
    const signature = await UniversalSigner.signWithEthereumHashMessage(
        signer,
        message
    );

    return { timestamp, signature };
};
