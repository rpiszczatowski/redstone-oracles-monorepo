import { ethers } from "hardhat";
import {
  getMockNumericPackage,
  getMockNumericMultiSignPackage,
  getMockSignedDataPackageObj,
  getMockStringPackage,
  getMockStringMultiSignPackage,
  getRange,
  MockNumericPackageArgs,
  MockSignerIndex,
  MockStringPackageArgs,
  MockNumericMultiSignPackageArgs,
  MockStringMultiSignPackageArgs,
  DEFAULT_TIMESTAMP_FOR_TESTS,
} from "../src/helpers/test-utils";
import { MockDataPackageConfig } from "../src/wrappers/MockWrapper";
import { MockMultiSignDataPackageConfig } from "../src/wrappers/MockWrapperMultiSign";
export const NUMBER_OF_MOCK_NUMERIC_SIGNERS = 10;
export const UNAUTHORISED_SIGNER_INDEX = 19;

export const manyAssetsDataPoints = [
  { dataFeedId: "ETH", value: 42 },
  { dataFeedId: "AVAX", value: 5 },
  { dataFeedId: "BTC", value: 100000 },
  { dataFeedId: "LINK", value: 2 },
  { dataFeedId: "UNI", value: 200 },
  { dataFeedId: "FRAX", value: 1 },
  { dataFeedId: "OMG", value: 0.00003 },
  { dataFeedId: "DOGE", value: 2 },
  { dataFeedId: "SOL", value: 11 },
  { dataFeedId: "BNB", value: 31 },
];

export const mockNumericPackageConfigs: MockNumericPackageArgs[] = [
  {
    mockSignerIndex: 0,
    dataPoints: [
      { dataFeedId: "BTC", value: 412 },
      { dataFeedId: "ETH", value: 41 },
      { dataFeedId: "SOME OTHER ID 0", value: 123 },
      { dataFeedId: "SOME OTHER ID 1", value: 123 },
    ],
  },
  {
    mockSignerIndex: 1,
    dataPoints: [
      { dataFeedId: "BTC", value: 390 },
      { dataFeedId: "ETH", value: 42 },
      { dataFeedId: "SOME OTHER ID 1", value: 123 },
    ],
  },
  {
    mockSignerIndex: 2,
    dataPoints: [
      { dataFeedId: "BTC", value: 400 },
      { dataFeedId: "ETH", value: 43 },
      { dataFeedId: "SOME OTHER ID 2", value: 123 },
    ],
  },
  ...getRange({ start: 3, length: NUMBER_OF_MOCK_NUMERIC_SIGNERS - 3 }).map(
    (mockSignerIndex: any) => ({
      mockSignerIndex,
      dataPoints: [
        { dataFeedId: "ETH", value: 42 },
        { dataFeedId: "BTC", value: 400 },
        { dataFeedId: "SOME OTHER ID", value: 123 },
      ],
    })
  ),
];

export const mockNumericPackageManyAssetsConfigs: MockNumericPackageArgs[] =
  getRange({ start: 0, length: NUMBER_OF_MOCK_NUMERIC_SIGNERS }).map((i) => ({
    mockSignerIndex: i as MockSignerIndex,
    dataPoints: manyAssetsDataPoints,
  }));

export const mockNumericPackageManyAssetsConfigsMultiSign: MockNumericMultiSignPackageArgs =
  {
    mockSignerIndices: getRange({
      start: 0,
      length: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
    }).map((i: number) => i as MockSignerIndex),
    dataPoints: manyAssetsDataPoints,
  };

export const mockNumericPackageConfigsAdditionalSigner: MockNumericPackageArgs[] =
  [
    ...mockNumericPackageConfigs,
    {
      mockSignerIndex: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
      dataPoints: mockNumericPackageConfigs[0].dataPoints,
    },
  ];

export const mockNumericPackageConfigsTooOldTimestamp: MockNumericPackageArgs[] =
  [
    ...mockNumericPackageConfigs.slice(0, NUMBER_OF_MOCK_NUMERIC_SIGNERS - 1),
    {
      mockSignerIndex: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
      dataPoints: mockNumericPackageConfigs[0].dataPoints,
      timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
    },
  ];

export const mockNumericPackageConfigsUnauthorizedSigner: MockNumericPackageArgs[] =
  [
    ...mockNumericPackageConfigs.slice(0, NUMBER_OF_MOCK_NUMERIC_SIGNERS - 1),
    {
      mockSignerIndex: UNAUTHORISED_SIGNER_INDEX,
      dataPoints: mockNumericPackageConfigs[0].dataPoints,
    },
  ];

export const mockNumericPackageConfigsDuplicateSigner: MockNumericPackageArgs[] =
  [
    ...mockNumericPackageConfigs.slice(0, NUMBER_OF_MOCK_NUMERIC_SIGNERS - 1),
    {
      mockSignerIndex: 0,
      dataPoints: mockNumericPackageConfigs[0].dataPoints,
    },
  ];

export const mockNumericPackageConfigsInsufficientNumberOfSigners: MockNumericPackageArgs[] =
  [...mockNumericPackageConfigs.slice(0, NUMBER_OF_MOCK_NUMERIC_SIGNERS - 1)];

export const mockNumericPackageMultiSignConfig: MockNumericMultiSignPackageArgs =
  {
    mockSignerIndices: getRange({
      start: 0,
      length: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
    }).map((i: number) => i as MockSignerIndex),
    dataPoints: [
      { dataFeedId: "ETH", value: 42 },
      { dataFeedId: "BTC", value: 400 },
      { dataFeedId: "SOME OTHER ID", value: 123 },
    ],
  };

export const mockNumericPackageMultiSignConfigAdditionalSigner: MockNumericMultiSignPackageArgs =
  {
    mockSignerIndices: getRange({
      start: 0,
      length: NUMBER_OF_MOCK_NUMERIC_SIGNERS + 1,
    }).map((i: number) => i as MockSignerIndex),
    dataPoints: mockNumericPackageMultiSignConfig.dataPoints,
  };

export const mockNumericPackageMultiSignConfigTooOldTimestamp: MockNumericMultiSignPackageArgs =
  {
    ...mockNumericPackageMultiSignConfig,
    timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
  };

export const mockNumericPackageMultiSignConfigUnauthorizedSigner: MockNumericMultiSignPackageArgs =
  {
    ...mockNumericPackageMultiSignConfig,
    mockSignerIndices: [
      ...mockNumericPackageMultiSignConfig.mockSignerIndices.slice(
        0,
        NUMBER_OF_MOCK_NUMERIC_SIGNERS - 1
      ),
      UNAUTHORISED_SIGNER_INDEX,
    ],
  };

export const mockNumericPackageMultiSignConfigDuplicateSigner: MockNumericMultiSignPackageArgs =
  {
    ...mockNumericPackageMultiSignConfig,
    mockSignerIndices: [
      ...mockNumericPackageMultiSignConfig.mockSignerIndices.slice(
        0,
        NUMBER_OF_MOCK_NUMERIC_SIGNERS - 1
      ),
      0,
    ],
  };

export const mockNumericPackageMultiSignConfigInsufficientNumberOfSigners: MockNumericMultiSignPackageArgs =
  {
    ...mockNumericPackageMultiSignConfig,
    mockSignerIndices:
      mockNumericPackageMultiSignConfig.mockSignerIndices.slice(
        0,
        NUMBER_OF_MOCK_NUMERIC_SIGNERS - 1
      ),
  };

export const mockSignedDataPackageObjects = mockNumericPackageConfigs.map(
  getMockSignedDataPackageObj
);

export const expectedNumericValues: any = {
  ETH: 42 * 10 ** 8,
  BTC: 400 * 10 ** 8,
};

export const bytesDataPoints = [
  {
    dataFeedId: "ETH",
    value: "Ethereum",
  },
  {
    dataFeedId: "BTC",
    value: "Bitcoin_",
  },
  {
    dataFeedId: "SOME OTHER ID",
    value: "Hahahaha",
  },
];

export const mockBytesPackageConfigs: MockStringPackageArgs[] = getRange({
  start: 0,
  length: 3,
}).map((i) => ({
  dataPoints: bytesDataPoints,
  mockSignerIndex: i as MockSignerIndex,
}));

export const mockBytesPackageConfigsAdditionalSigner: MockStringPackageArgs[] =
  [
    ...mockBytesPackageConfigs,
    {
      mockSignerIndex: 3,
      dataPoints: mockBytesPackageConfigs[0].dataPoints,
    },
  ];

export const mockBytesPackageConfigsTooOldTimestamp: MockStringPackageArgs[] = [
  ...mockBytesPackageConfigs.slice(0, 2),
  {
    mockSignerIndex: 3,
    dataPoints: mockBytesPackageConfigs[0].dataPoints,
    timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
  },
];

export const mockBytesPackageConfigsUnauthorizedSigner: MockStringPackageArgs[] =
  [
    ...mockBytesPackageConfigs.slice(0, 2),
    {
      mockSignerIndex: UNAUTHORISED_SIGNER_INDEX,
      dataPoints: mockBytesPackageConfigs[0].dataPoints,
    },
  ];

export const mockBytesPackageConfigsDuplicateSigner: MockStringPackageArgs[] = [
  ...mockBytesPackageConfigs.slice(0, 2),
  {
    mockSignerIndex: 0,
    dataPoints: mockBytesPackageConfigs[0].dataPoints,
  },
];

export const mockBytesPackageConfigsInsufficientNumberOfSigners: MockStringPackageArgs[] =
  [...mockBytesPackageConfigs.slice(0, 2)];

export const mockBytesPackageMultiSignConfig: MockStringMultiSignPackageArgs = {
  mockSignerIndices: getRange({
    start: 0,
    length: 3,
  }).map((i: number) => i as MockSignerIndex),
  dataPoints: bytesDataPoints,
};

export const mockBytesPackageMultiSignConfigAdditionalSigner: MockStringMultiSignPackageArgs =
  {
    mockSignerIndices: getRange({
      start: 0,
      length: 4,
    }).map((i: number) => i as MockSignerIndex),
    dataPoints: mockBytesPackageMultiSignConfig.dataPoints,
  };

export const mockBytesPackageMultiSignConfigTooOldTimestamp: MockStringMultiSignPackageArgs =
  {
    ...mockBytesPackageMultiSignConfig,
    timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
  };

export const mockBytesPackageMultiSignConfigUnauthorizedSigner: MockStringMultiSignPackageArgs =
  {
    ...mockBytesPackageMultiSignConfig,
    mockSignerIndices: [
      ...mockBytesPackageMultiSignConfig.mockSignerIndices.slice(0, 2),
      UNAUTHORISED_SIGNER_INDEX,
    ],
  };

export const mockBytesPackageMultiSignConfigDuplicateSigner: MockStringMultiSignPackageArgs =
  {
    ...mockBytesPackageMultiSignConfig,
    mockSignerIndices: [
      ...mockBytesPackageMultiSignConfig.mockSignerIndices.slice(0, 2),
      0,
    ],
  };

export const mockBytesPackageMultiSignConfigInsufficientNumberOfSigners: MockStringMultiSignPackageArgs =
  {
    ...mockBytesPackageMultiSignConfig,
    mockSignerIndices: mockBytesPackageMultiSignConfig.mockSignerIndices.slice(
      0,
      2
    ),
  };

export const mockBytesPackages =
  mockBytesPackageConfigs.map(getMockStringPackage);

export const mockBytesPackageMultiSign = getMockStringMultiSignPackage(
  mockBytesPackageMultiSignConfig
);

export const expectedBytesValues = {
  ETH: "0x457468657265756d",
  BTC: "0x426974636f696e5f",
};

export const getBlockTimestampMilliseconds = async () => {
  const blockNum = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNum);
  return block.timestamp * 1000;
};

export interface IMockDataPackagesSuite {
  mockDataPackages: MockDataPackageConfig[] | MockMultiSignDataPackageConfig;
  mockDataPackagesWithManyAssets:
    | MockDataPackageConfig[]
    | MockMultiSignDataPackageConfig;
  mockDataPackagesWithAdditionalSigner:
    | MockDataPackageConfig[]
    | MockMultiSignDataPackageConfig;
  mockDataPackagesWithTooOldTimestamp:
    | MockDataPackageConfig[]
    | MockMultiSignDataPackageConfig;
  mockDataPackagesWithUnauthorizedSigner:
    | MockDataPackageConfig[]
    | MockMultiSignDataPackageConfig;
  mockDataPackagesWithDuplicateSigner:
    | MockDataPackageConfig[]
    | MockMultiSignDataPackageConfig;
  mockDataPackagesWithInsufficientNumberOfSigners:
    | MockDataPackageConfig[]
    | MockMultiSignDataPackageConfig;
}

export class MockNumericDataPackagesSingleSignSuite
  implements IMockDataPackagesSuite
{
  mockDataPackages = mockNumericPackageConfigs.map(getMockNumericPackage);
  mockDataPackagesWithManyAssets = mockNumericPackageManyAssetsConfigs.map(
    getMockNumericPackage
  );
  mockDataPackagesWithAdditionalSigner =
    mockNumericPackageConfigsAdditionalSigner.map(getMockNumericPackage);
  mockDataPackagesWithTooOldTimestamp =
    mockNumericPackageConfigsTooOldTimestamp.map(getMockNumericPackage);
  mockDataPackagesWithUnauthorizedSigner =
    mockNumericPackageConfigsUnauthorizedSigner.map(getMockNumericPackage);
  mockDataPackagesWithDuplicateSigner =
    mockNumericPackageConfigsDuplicateSigner.map(getMockNumericPackage);
  mockDataPackagesWithInsufficientNumberOfSigners =
    mockNumericPackageConfigsInsufficientNumberOfSigners.map(
      getMockNumericPackage
    );
}

export class MockNumericDataPackagesMultiSignSuite
  implements IMockDataPackagesSuite
{
  mockDataPackages = getMockNumericMultiSignPackage(
    mockNumericPackageMultiSignConfig
  );
  mockDataPackagesWithManyAssets = getMockNumericMultiSignPackage(
    mockNumericPackageManyAssetsConfigsMultiSign
  );
  mockDataPackagesWithAdditionalSigner = getMockNumericMultiSignPackage(
    mockNumericPackageMultiSignConfigAdditionalSigner
  );
  mockDataPackagesWithTooOldTimestamp = getMockNumericMultiSignPackage(
    mockNumericPackageMultiSignConfigTooOldTimestamp
  );
  mockDataPackagesWithUnauthorizedSigner = getMockNumericMultiSignPackage(
    mockNumericPackageMultiSignConfigUnauthorizedSigner
  );
  mockDataPackagesWithDuplicateSigner = getMockNumericMultiSignPackage(
    mockNumericPackageMultiSignConfigDuplicateSigner
  );
  mockDataPackagesWithInsufficientNumberOfSigners =
    getMockNumericMultiSignPackage(
      mockNumericPackageMultiSignConfigInsufficientNumberOfSigners
    );
}

export class MockBytesDataPackagesSingleSignSuite implements IMockDataPackagesSuite {
  mockDataPackages = mockBytesPackages;
  mockDataPackagesWithManyAssets = mockBytesPackages;
  mockDataPackagesWithAdditionalSigner = mockBytesPackageConfigsAdditionalSigner.map(
    getMockStringPackage
  );
  mockDataPackagesWithTooOldTimestamp = mockBytesPackageConfigsTooOldTimestamp.map(
    getMockStringPackage
  );
  mockDataPackagesWithUnauthorizedSigner = mockBytesPackageConfigsUnauthorizedSigner.map(
    getMockStringPackage
  );
  mockDataPackagesWithDuplicateSigner = mockBytesPackageConfigsDuplicateSigner.map(
    getMockStringPackage
  );
  mockDataPackagesWithInsufficientNumberOfSigners = mockBytesPackageConfigsInsufficientNumberOfSigners.map(
    getMockStringPackage
  );
}

export class MockBytesDataPackagesMultiSignSuite implements IMockDataPackagesSuite {
  mockDataPackages = mockBytesPackageMultiSign;
  mockDataPackagesWithManyAssets = mockBytesPackageMultiSign;
  mockDataPackagesWithAdditionalSigner = getMockStringMultiSignPackage(
    mockBytesPackageMultiSignConfigAdditionalSigner
  );
  mockDataPackagesWithTooOldTimestamp = getMockStringMultiSignPackage(
    mockBytesPackageMultiSignConfigTooOldTimestamp
  );
  mockDataPackagesWithUnauthorizedSigner = getMockStringMultiSignPackage(
    mockBytesPackageMultiSignConfigUnauthorizedSigner
  );
  mockDataPackagesWithDuplicateSigner = getMockStringMultiSignPackage(
    mockBytesPackageMultiSignConfigDuplicateSigner
  );
  mockDataPackagesWithInsufficientNumberOfSigners = getMockStringMultiSignPackage(
    mockBytesPackageMultiSignConfigInsufficientNumberOfSigners
  );
}
