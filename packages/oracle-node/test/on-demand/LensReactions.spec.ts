import axios from "axios";
import { fetchLensLikesByPostId } from "../../src/on-demand/LensReactions";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Lens Reactions from Warp contract", () => {

    it("should fail if contract state wasn't evaluated", async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { state: {}, status: "WRONG" } });

        await expect(fetchLensLikesByPostId("0x02-0x01"))
            .rejects.toThrowError("State wasn't evaluated")
    });

    it("should return 0 on missing postId", async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { state: {}, status: "evaluated" } });

        expect(await fetchLensLikesByPostId("0x02-0x01"))
            .toStrictEqual(0);
    });


    it("should ignore dislikes", async () => {
        const state = { "0x02-0x01": { likes: 5, dislikes: 4 } }
        mockedAxios.get.mockResolvedValueOnce({ data: { state, status: "evaluated" } });

        expect(await fetchLensLikesByPostId("0x02-0x01"))
            .toStrictEqual(5)
    });

    it("without likes", async () => {
        const state = { "0x02-0x01": { likes: 0, dislikes: 4 } }
        mockedAxios.get.mockResolvedValueOnce({ data: { state, status: "evaluated" } });

        expect(await fetchLensLikesByPostId("0x02-0x01"))
            .toStrictEqual(0)
    });

    it("without dislikes", async () => {
        const state = { "0x02-0x01": { likes: 4, dislikes: 0 } }
        mockedAxios.get.mockResolvedValueOnce({ data: { state, status: "evaluated" } });

        expect(await fetchLensLikesByPostId("0x02-0x01"))
            .toStrictEqual(4)
    });

});