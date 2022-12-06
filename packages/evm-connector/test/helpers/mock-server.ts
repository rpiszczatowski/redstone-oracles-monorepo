import { setupServer } from "msw/node";
import { rest, RestRequest } from "msw";
import {
  signOnDemandDataPackage,
  UniversalSigner,
  prepareMessageToSign,
} from "redstone-protocol";
import { MOCK_PRIVATE_KEYS } from "../../src/helpers/test-utils";

interface OnDemandRequestResponse {
  dataPoints: [
    {
      dataFeedId: string;
      value: number;
    }
  ];
  timestampMilliseconds: number;
  signature: string;
}

const VERIFIED_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export const handlers = [

  rest.get<OnDemandRequestResponse>(
    "http://first-node.com/lens-reactions",
    async (req, res, ctx) => {
      const signedDataPackage = getSignedDataPackage({
        request: req,
        privateKey: MOCK_PRIVATE_KEYS[1],
        value: 10,
        dataFeedId: getParam(req, "postId")
      });

      return res(ctx.json(signedDataPackage.toObj()))
    }
  ),

  rest.get<OnDemandRequestResponse>(
    "http://second-node.com/lens-reactions",
    async (req, res, ctx) => {
      const signedDataPackage = getSignedDataPackage({
        request: req,
        privateKey: MOCK_PRIVATE_KEYS[2],
        value: 10,
        dataFeedId: getParam(req, "postId")
      });

      return res(ctx.json(signedDataPackage.toObj()))
    }
  ),

  rest.get<OnDemandRequestResponse>(
    "http://invalid-node.com/lens-reactions",
    async (req, res, ctx) => {
      const signedDataPackage = getSignedDataPackage({
        request: req,
        privateKey: MOCK_PRIVATE_KEYS[1],
        value: 10,
        dataFeedId: "wrong-data-feed-id"
      });

      return res(ctx.json(signedDataPackage.toObj()))
    }
  ),

  rest.get<OnDemandRequestResponse>(
    "http://invalid-value-node.com/lens-reactions",
    async (req, res, ctx) => {
      const signedDataPackage = getSignedDataPackage({
        request: req,
        privateKey: MOCK_PRIVATE_KEYS[2],
        value: 15,
        dataFeedId: getParam(req, "postId")
      });

      return res(ctx.json(signedDataPackage.toObj()))
    }
  ),

  rest.get<OnDemandRequestResponse>(
    "http://first-node.com/score-by-address",
    async (req, res, ctx) => {
      const signedDataPackage = getSignedDataPackage({
        request: req,
        privateKey: MOCK_PRIVATE_KEYS[1],
        valueBasedOnAddress: true,
      });

      return res(ctx.json(signedDataPackage.toObj()));
    }
  ),

  rest.get<OnDemandRequestResponse>(
    "http://second-node.com/score-by-address",
    async (req, res, ctx) => {
      const signedDataPackage = getSignedDataPackage({
        request: req,
        privateKey: MOCK_PRIVATE_KEYS[2],
        valueBasedOnAddress: true,
      });

      return res(ctx.json(signedDataPackage.toObj()));
    }
  ),

  rest.get<OnDemandRequestResponse>(
    "http://invalid-address-node.com/score-by-address",
    async (req, res, ctx) => {
      const signedDataPackage = getSignedDataPackage({
        request: req,
        value: 1234,
        privateKey: MOCK_PRIVATE_KEYS[2],
        dataFeedId: "invalid data feed id",
      });

      return res(ctx.json(signedDataPackage.toObj()));
    }
  ),

  rest.get<OnDemandRequestResponse>(
    "http://invalid-value-node.com/score-by-address",
    async (req, res, ctx) => {
      const signedDataPackage = getSignedDataPackage({
        request: req,
        value: 1234,
        privateKey: MOCK_PRIVATE_KEYS[2],
      });
      return res(ctx.json(signedDataPackage.toObj()));
    }
  ),
];

const getSignedDataPackage = ({
  request,
  privateKey,
  value = 0,
  dataFeedId,
  valueBasedOnAddress = false,
}: {
  request: RestRequest;
  privateKey: string;
  value?: number;
  dataFeedId?: string;
  valueBasedOnAddress?: boolean;
}) => {
  const timestamp = getParam(request, "timestamp");
  const signature = getParam(request, "signature");
  const message = prepareMessageToSign(Number(timestamp));
  const address = UniversalSigner.recoverAddressFromEthereumHashMessage(
    message,
    signature
  );
  let valueToResponse = value;
  if (valueBasedOnAddress) {
    valueToResponse = address === VERIFIED_ADDRESS ? 1 : 0;
  }

  return signOnDemandDataPackage(
    !!dataFeedId ? dataFeedId : address,
    valueToResponse,
    Number(timestamp),
    privateKey
  );
};

function getParam(request: RestRequest, name: string) {
  return request.url.searchParams.get(name) ?? "";
}

export const getServer = () => setupServer(...handlers);


