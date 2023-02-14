import { Wallet } from "ethers";
import { computePublicKey, hexlify } from "ethers/lib/utils";
import { DataPackage } from "../src/data-package/DataPackage";
import { SignedDataPackage } from "../src/data-package/SignedDataPackage";
import { MultiSignDataPackage } from "../src/data-package/MultiSignDataPackage";
import { NumericDataPoint } from "../src/data-point/NumericDataPoint";

const TIMESTAMP_FOR_TESTS = 1654353400000;
const PRIVATE_KEY_FOR_TESTS_1 =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const PRIVATE_KEY_FOR_TESTS_2 =
  "0x1111111111111111111111111111111111111111111111111111111111111112";
const EXPECTED_SERIALIZED_UNSIGNED_DATA_PACKAGE =
  "0x" +
  "4254430000000000000000000000000000000000000000000000000000000000" + // bytes32("BTC")
  "000000000000000000000000000000000000000000000000000003d1e3821000" + // 42000 * 10^8
  "4554480000000000000000000000000000000000000000000000000000000000" + // bytes32("ETH")
  "0000000000000000000000000000000000000000000000000000002e90edd000" + // 2000 * 10^8
  "01812f2590c0" + // timestamp
  "00000020" + // data points value byte size (32 in hex)
  "000002"; // data points count
const EXPECTED_SIGNATURE_1 =
  "c1296a449f5d353c8b04eb389f33a583ee79449cca6e366900042f19f2521e722a410929223231905839c00865af68738f1a202478d87dc33675ea5824f343901b";

const EXPECTED_SIGNATURE_2 =
  "3032dc0e739109ad7e9a2762a34778bda263e9ea4d9d0b76e18dbc76d03405677cc55914518c9587b3e2602ff6149999ba76c9d1da84687d29d8ec60dbdc928a1b";
describe("Data package", () => {
  let dataPackage: DataPackage;

  beforeEach(() => {
    const dataPoints = [
      { dataFeedId: "BTC", value: 42000 },
      { dataFeedId: "ETH", value: 2000 },
    ].map((dpArgs) => new NumericDataPoint(dpArgs));
    dataPackage = new DataPackage(dataPoints, TIMESTAMP_FOR_TESTS);
  });

  test("Should serialize data package", () => {
    expect(dataPackage.toBytesHex()).toBe(
      EXPECTED_SERIALIZED_UNSIGNED_DATA_PACKAGE
    );
  });

  test("Changed order of data points should not affect serialized bytes", () => {
    const tmpDataPoint = dataPackage.dataPoints[0];
    dataPackage.dataPoints[0] = dataPackage.dataPoints[1];
    dataPackage.dataPoints[1] = tmpDataPoint;

    expect(dataPackage.toBytesHex()).toBe(
      EXPECTED_SERIALIZED_UNSIGNED_DATA_PACKAGE
    );
  });

  test("Should throw an error for data points with duplicated dataFeedIds", () => {
    dataPackage.dataPoints[0] = dataPackage.dataPoints[1];
    expect(() => dataPackage.toBytesHex()).toThrow(
      "Assertion failed: Duplicated dataFeedId found: ETH"
    );
  });

  test("Should sign data package", () => {
    const signedDataPackage = dataPackage.sign(PRIVATE_KEY_FOR_TESTS_1);
    expect(signedDataPackage.serializeSignatureToHex()).toBe(
      "0x" + EXPECTED_SIGNATURE_1
    );
    expect(signedDataPackage.toBytesHex()).toBe(
      EXPECTED_SERIALIZED_UNSIGNED_DATA_PACKAGE + EXPECTED_SIGNATURE_1
    );
  });

  test("Should sign data package with two signatures", () => {
    const signedDataPackage = dataPackage.multiSign([
      PRIVATE_KEY_FOR_TESTS_1,
      PRIVATE_KEY_FOR_TESTS_2,
    ]);
    expect(signedDataPackage.serializeSignaturesToHex()).toEqual([
      "0x" + EXPECTED_SIGNATURE_1,
      "0x" + EXPECTED_SIGNATURE_2,
    ]);
    expect(signedDataPackage.toBytesHex()).toBe(
      EXPECTED_SERIALIZED_UNSIGNED_DATA_PACKAGE +
        EXPECTED_SIGNATURE_1 +
        EXPECTED_SIGNATURE_2 +
        "0002"
    );
  });

  test("Should verify data package signature", () => {
    const signedDataPackage = new SignedDataPackage(
      dataPackage,
      "0x" + EXPECTED_SIGNATURE_1
    );

    // Check public key
    const expectedPublicKey = computePublicKey(PRIVATE_KEY_FOR_TESTS_1);
    const recoveredPublicKey = signedDataPackage.recoverSignerPublicKey();
    expect(hexlify(recoveredPublicKey)).toBe(expectedPublicKey);

    // Check address
    const expectedAddress = new Wallet(PRIVATE_KEY_FOR_TESTS_1).address;
    const recoveredAddress = signedDataPackage.recoverSignerAddress();
    expect(recoveredAddress).toBe(expectedAddress);
  });

  test("Should verify data package signature with two signatures", () => {
    const signedDataPackage = new MultiSignDataPackage(dataPackage, [
      "0x" + EXPECTED_SIGNATURE_1,
      "0x" + EXPECTED_SIGNATURE_2,
    ]);

    // Check public key
    const expectedPublicKey = computePublicKey(PRIVATE_KEY_FOR_TESTS_1);
    const recoveredPublicKey = signedDataPackage.recoverSignersPublicKeys()[0];
    expect(hexlify(recoveredPublicKey)).toBe(expectedPublicKey);

    // Check address
    const expectedAddress = new Wallet(PRIVATE_KEY_FOR_TESTS_1).address;
    const recoveredAddress = signedDataPackage.recoverSignersAddresses()[0];
    expect(recoveredAddress).toBe(expectedAddress);
  });
});
