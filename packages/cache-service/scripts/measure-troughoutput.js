const axios = require("axios");
const { UniversalSigner } = require("redstone-protocol");

const MOCK_SIGNATURE =
  "GPZOwPKiZM1UreO9Aeq5rO/fdA9VqnocYgMJ1kIKn6FC0MQmXYnnIgepT3Ji9LsHPn9wUDD8RhUN6lR5k9Mbehs=";
const MOCK_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const mockDataPackages = [
  {
    timestampMilliseconds: 1654353400000,
    signature: MOCK_SIGNATURE,
    dataPoints: [
      { dataFeedId: "mock-data-feed-id-2", value: 123 },
      { dataFeedId: "mock-data-feed-id-2", value: 123 },
    ],
  },
];
const { hrtime } = process;

const PARALELL_MEASUREMENT = false;
const NUM_REQUESTS = 100;

async function measureExecutionTime(params, numRequests) {
  const startTime = hrtime();

  for (let i = 0; i < numRequests; i++) {
    await axios(params)
      .then((response) => {
        console.log(`Request ${i + 1}: ${response.status}`);
      })
      .catch((error) => {
        console.error(`Request ${i + 1} failed: ${error.message}`);
      });
  }

  const endTime = hrtime(startTime);
  const elapsedTimeInSeconds = endTime[0] + endTime[1] / 1e9;

  console.log(`Execution time: ${elapsedTimeInSeconds} seconds`);
  console.log(
    `Average request time: ${elapsedTimeInSeconds / numRequests} seconds`
  );
}

async function measureExecutionTimeInParallel(params, numRequests) {
  const requests = Array(numRequests)
    .fill()
    .map(() => axios(params));

  const startTime = hrtime();

  try {
    const responses = await Promise.all(requests);
    responses.forEach((response, i) => {
      console.log(`Request ${i + 1}: ${response.status}`);
    });
  } catch (error) {
    console.error(`One or more requests failed: ${error.message}`);
  }

  const endTime = hrtime(startTime);
  const elapsedTimeInSeconds = endTime[0] + endTime[1] / 1e9;

  console.log(`Execution time: ${elapsedTimeInSeconds} seconds`);
}

async function measureTroughOutput() {
  const requestSignature = UniversalSigner.signStringifiableData(
    mockDataPackages,
    MOCK_PRIVATE_KEY
  );

  const options = {
    method: "POST",
    url: "http://localhost:3000/data-packages/bulk",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      requestSignature,
      dataPackages: mockDataPackages,
    },
    json: true,
  };

  if (PARALELL_MEASUREMENT) {
    return measureExecutionTimeInParallel(options, NUM_REQUESTS);
  }
  return measureExecutionTime(options, NUM_REQUESTS);
}

try {
  await measureTroughOutput();
} catch (error) {
  console.log(error);
}
