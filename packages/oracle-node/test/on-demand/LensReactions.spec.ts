import axios from "axios";
import { fetchLensReactionsByPostId } from "../../src/on-demand/LensReactions";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Lens Reactions from Warp contract", () => {

    it("should fail if contract state wasn't evaluated", async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { state: {}, status: "WRONG" } });

        await expect(fetchLensReactionsByPostId("0x01"))
            .rejects.toThrowError("State wasn't evaluated")
    });

    it("should fail on missing postId", async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { state: {}, status: "evaluated" } });

        await expect(fetchLensReactionsByPostId("0x01"))
            .rejects.toThrowError("Post 0x01 not found");
    });


    it("should subtract dislikes from likes", async () => {
        const state = { "0x01": { likes: 5, dislikes: 4 } }
        mockedAxios.get.mockResolvedValueOnce({ data: { state, status: "evaluated" } });

        expect(await fetchLensReactionsByPostId("0x01"))
            .toStrictEqual(5 - 4)
    });

    it("without likes", async () => {
        const state = { "0x01": { likes: 0, dislikes: 4 } }
        mockedAxios.get.mockResolvedValueOnce({ data: { state, status: "evaluated" } });

        expect(await fetchLensReactionsByPostId("0x01"))
            .toStrictEqual(-4)
    });

    it("without dislikes", async () => {
        const state = { "0x01": { likes: 4, dislikes: 0 } }
        mockedAxios.get.mockResolvedValueOnce({ data: { state, status: "evaluated" } });

        expect(await fetchLensReactionsByPostId("0x01"))
            .toStrictEqual(4)
    });

});