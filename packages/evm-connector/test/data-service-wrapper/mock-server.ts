import { setupServer } from "msw/node";
import { rest } from "msw";

const handlers = [
  rest.get(
    "http://valid-cache.com/data-packages/latest",
    async (req, res, ctx) => {
      return res(
        ctx.json({
          YAK: [
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "2SIsbqFa1n92V3eDbMQ1nmv/qDK8IWLmsLOpdbcy+nk1RjBy6sUfJF4oxZk7RSP/QRxhQPw59iS8iUj8wqyf3xw=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.76143763941604 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x1Cd8F9627a2838a7DAE6b98CF71c08B9CbF5174a",
            },
            {
              timestampMilliseconds: 1669799468685,
              signature:
                "SGEhnZEsHAwuCuvTtmJ/uZ7G0qheYnCR6SbCsdZo0tgg/L4Pva9DEiftFmBb7hsja+XT0rNZDJNhnAFk6weVNhs=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.66643763941607 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x3BEFDd935b50F172e696A5187DBaCfEf0D208e48",
            },
            {
              timestampMilliseconds: 1669799470846,
              signature:
                "vpRdVLCQtZmfWLImLHatuWXYne9hsdPu7yW5EItNCcEpbEJflW1X4It/7+iMUMPNKFjJiDnEZ3U+qvBYxZYkfBw=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.76143763941604 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x41FB6b8d0f586E73d575bC57CFD29142B3214A47",
            },
            {
              timestampMilliseconds: 1669799466839,
              signature:
                "P9ntumhbVaqZkk8KHEZ9PIbHDxlI65beznjHG7DjReZ4q+mhMZ/yauZkS1kDIU+HPLfvR1BRPIBlGBYF8CtKIRs=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.70287527883212 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x496f4E8aC11076350A59b88D2ad62bc20d410EA3",
            },
            {
              timestampMilliseconds: 1669799462727,
              signature:
                "rN+Uhx9S9KZtpWLafo4vdqGehI6JSksD+HgRMb+Th+hFptaNpMowH+z/xDOWiHGPcJzwBpZLBEWUIJoJalow7xs=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.76143763941604 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x981bdA8276ae93F567922497153de7A5683708d3",
            },
          ],
          AVAX: [
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "qcZaPgxzWoQvXHunTKrh27sQ9OYt4i3Rks8tsFOpeTlpe0TQG4V4+b6MPcJtJwxk7uZkNfKazwZsQdL/InSAAxw=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.967873377 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x1Cd8F9627a2838a7DAE6b98CF71c08B9CbF5174a",
            },
            {
              timestampMilliseconds: 1669799468685,
              signature:
                "ijWqCf0Y8fLlfP8oBp0Mqn2Nj5i29B4yl9iHRRbX0AtILIioKrpiWGrMN3cmfp5JU+Lax00h1v7yz7ifaaGsgxs=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.967873377 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x3BEFDd935b50F172e696A5187DBaCfEf0D208e48",
            },
            {
              timestampMilliseconds: 1669799470846,
              signature:
                "dOAgsu6JG6SHadwp34FaLWz8zKwI2RxMGmdRQJQHevoCw3ClnqRb8AZ6WdPWdqk/rqrmcC0CVjjz8OgqTTMlZhs=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.963323877499999 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x41FB6b8d0f586E73d575bC57CFD29142B3214A47",
            },
            {
              timestampMilliseconds: 1669799466839,
              signature:
                "iDsvyzc0XpWB79+mQTxTeKGsmeDm8r0ZNhMZZ4bSzhte9Jsi0JTi/tFwLE2gXH64ceQiFdbzjVBeHqR4dnObNhw=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.967173454 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x496f4E8aC11076350A59b88D2ad62bc20d410EA3",
            },
            {
              timestampMilliseconds: 1669799462727,
              signature:
                "R2FGC/p2LN0iRHfgQlnn/SVO6r+8ZvANbXK8k4VJSTVLf2OpXT6Ap3zLwGqAGxX7kd64PeWpJwh4kBTMDfeQZRs=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.967873377 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x981bdA8276ae93F567922497153de7A5683708d3",
            },
          ],
        })
      );
    }
  ),
  rest.get(
    "http://invalid-cache.com/data-packages/latest",
    async (req, res, ctx) => {
      return res(
        ctx.json({
          YAK: [
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "2SIsbqFa1n92V3eDbMQ1nmv/qDK8IWLmsLOpdbcy+nk1RjBy6sUfJF4oxZk7RSP/QRxhQPw59iS8iUj8wqyf3xw=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.76143763941604 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x1Cd8F9627a2838a7DAE6b98CF71c08B9CbF5174a",
            },
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "SGEhnZEsHAwuCuvTtmJ/uZ7G0qheYnCR6SbCsdZo0tgg/L4Pva9DEiftFmBb7hsja+XT0rNZDJNhnAFk6weVNhs=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.66643763941607 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x3BEFDd935b50F172e696A5187DBaCfEf0D208e48",
            },
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "vpRdVLCQtZmfWLImLHatuWXYne9hsdPu7yW5EItNCcEpbEJflW1X4It/7+iMUMPNKFjJiDnEZ3U+qvBYxZYkfBw=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.76143763941604 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x41FB6b8d0f586E73d575bC57CFD29142B3214A47",
            },
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "P9ntumhbVaqZkk8KHEZ9PIbHDxlI65beznjHG7DjReZ4q+mhMZ/yauZkS1kDIU+HPLfvR1BRPIBlGBYF8CtKIRs=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.70287527883212 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x496f4E8aC11076350A59b88D2ad62bc20d410EA3",
            },
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "rN+Uhx9S9KZtpWLafo4vdqGehI6JSksD+HgRMb+Th+hFptaNpMowH+z/xDOWiHGPcJzwBpZLBEWUIJoJalow7xs=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.76143763941604 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x981bdA8276ae93F567922497153de7A5683708d3",
            },
          ],
          AVAX: [
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "qcZaPgxzWoQvXHunTKrh27sQ9OYt4i3Rks8tsFOpeTlpe0TQG4V4+b6MPcJtJwxk7uZkNfKazwZsQdL/InSAAxw=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.967873377 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x1Cd8F9627a2838a7DAE6b98CF71c08B9CbF5174a",
            },
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "ijWqCf0Y8fLlfP8oBp0Mqn2Nj5i29B4yl9iHRRbX0AtILIioKrpiWGrMN3cmfp5JU+Lax00h1v7yz7ifaaGsgxs=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.967873377 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x3BEFDd935b50F172e696A5187DBaCfEf0D208e48",
            },
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "dOAgsu6JG6SHadwp34FaLWz8zKwI2RxMGmdRQJQHevoCw3ClnqRb8AZ6WdPWdqk/rqrmcC0CVjjz8OgqTTMlZhs=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.963323877499999 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x41FB6b8d0f586E73d575bC57CFD29142B3214A47",
            },
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "iDsvyzc0XpWB79+mQTxTeKGsmeDm8r0ZNhMZZ4bSzhte9Jsi0JTi/tFwLE2gXH64ceQiFdbzjVBeHqR4dnObNhw=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.967173454 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x496f4E8aC11076350A59b88D2ad62bc20d410EA3",
            },
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "R2FGC/p2LN0iRHfgQlnn/SVO6r+8ZvANbXK8k4VJSTVLf2OpXT6Ap3zLwGqAGxX7kd64PeWpJwh4kBTMDfeQZRs=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.967873377 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x981bdA8276ae93F567922497153de7A5683708d3",
            },
          ],
        })
      );
    }
  ),
  rest.get(
    "http://slower-cache.com/data-packages/latest",
    async (req, res, ctx) => {
      return res(
        ctx.delay(100),
        ctx.json({
          YAK: [
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "2SIsbqFa1n92V3eDbMQ1nmv/qDK8IWLmsLOpdbcy+nk1RjBy6sUfJF4oxZk7RSP/QRxhQPw59iS8iUj8wqyf3xw=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.76143763941604 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x1Cd8F9627a2838a7DAE6b98CF71c08B9CbF5174a",
            },
            {
              timestampMilliseconds: 1669799468685,
              signature:
                "SGEhnZEsHAwuCuvTtmJ/uZ7G0qheYnCR6SbCsdZo0tgg/L4Pva9DEiftFmBb7hsja+XT0rNZDJNhnAFk6weVNhs=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.66643763941607 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x3BEFDd935b50F172e696A5187DBaCfEf0D208e48",
            },
            {
              timestampMilliseconds: 1669799470846,
              signature:
                "vpRdVLCQtZmfWLImLHatuWXYne9hsdPu7yW5EItNCcEpbEJflW1X4It/7+iMUMPNKFjJiDnEZ3U+qvBYxZYkfBw=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.76143763941604 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x41FB6b8d0f586E73d575bC57CFD29142B3214A47",
            },
            {
              timestampMilliseconds: 1669799466839,
              signature:
                "P9ntumhbVaqZkk8KHEZ9PIbHDxlI65beznjHG7DjReZ4q+mhMZ/yauZkS1kDIU+HPLfvR1BRPIBlGBYF8CtKIRs=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.70287527883212 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x496f4E8aC11076350A59b88D2ad62bc20d410EA3",
            },
            {
              timestampMilliseconds: 1669799462727,
              signature:
                "rN+Uhx9S9KZtpWLafo4vdqGehI6JSksD+HgRMb+Th+hFptaNpMowH+z/xDOWiHGPcJzwBpZLBEWUIJoJalow7xs=",
              dataPoints: [{ dataFeedId: "YAK", value: 208.76143763941604 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "YAK",
              sources: null,
              signerAddress: "0x981bdA8276ae93F567922497153de7A5683708d3",
            },
          ],
          AVAX: [
            {
              timestampMilliseconds: 1669799464677,
              signature:
                "qcZaPgxzWoQvXHunTKrh27sQ9OYt4i3Rks8tsFOpeTlpe0TQG4V4+b6MPcJtJwxk7uZkNfKazwZsQdL/InSAAxw=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.967873377 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x1Cd8F9627a2838a7DAE6b98CF71c08B9CbF5174a",
            },
            {
              timestampMilliseconds: 1669799468685,
              signature:
                "ijWqCf0Y8fLlfP8oBp0Mqn2Nj5i29B4yl9iHRRbX0AtILIioKrpiWGrMN3cmfp5JU+Lax00h1v7yz7ifaaGsgxs=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.967873377 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x3BEFDd935b50F172e696A5187DBaCfEf0D208e48",
            },
            {
              timestampMilliseconds: 1669799470846,
              signature:
                "dOAgsu6JG6SHadwp34FaLWz8zKwI2RxMGmdRQJQHevoCw3ClnqRb8AZ6WdPWdqk/rqrmcC0CVjjz8OgqTTMlZhs=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.963323877499999 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x41FB6b8d0f586E73d575bC57CFD29142B3214A47",
            },
            {
              timestampMilliseconds: 1669799466839,
              signature:
                "iDsvyzc0XpWB79+mQTxTeKGsmeDm8r0ZNhMZZ4bSzhte9Jsi0JTi/tFwLE2gXH64ceQiFdbzjVBeHqR4dnObNhw=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.967173454 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x496f4E8aC11076350A59b88D2ad62bc20d410EA3",
            },
            {
              timestampMilliseconds: 1669799462727,
              signature:
                "R2FGC/p2LN0iRHfgQlnn/SVO6r+8ZvANbXK8k4VJSTVLf2OpXT6Ap3zLwGqAGxX7kd64PeWpJwh4kBTMDfeQZRs=",
              dataPoints: [{ dataFeedId: "AVAX", value: 12.967873377 }],
              dataServiceId: "redstone-avalanche-prod",
              dataFeedId: "AVAX",
              sources: null,
              signerAddress: "0x981bdA8276ae93F567922497153de7A5683708d3",
            },
          ],
        })
      );
    }
  ),
];

export const server = setupServer(...handlers);
