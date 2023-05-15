import { SIGNATURE_BS } from "redstone-protocol/src/common/redstone-constants";
import { beginCell } from "ton-core";
import { arrayify } from "ethers/lib/utils";
import assert from "assert";
import { splitPayloadHex } from "./split-payload-hex";

export function createPayloadCell(payloadHex: string) {
  const { dataPackageChunks, metadata } = splitPayloadHex(payloadHex);

  assert(
    dataPackageChunks.length <= 16,
    `Must be implemented for larger data (${dataPackageChunks.length} > 16)`
  );

  let lastCellIndex = -1;
  const payloadCell = beginCell().storeBuffer(
    Buffer.from(arrayify("0x" + metadata))
  );
  let cell = beginCell();
  for (let i = 0; i <= dataPackageChunks.length; i++) {
    const payloadCellIndex = Math.floor(i / 4);
    if (
      (payloadCellIndex !== lastCellIndex && i !== 0) ||
      i === dataPackageChunks.length
    ) {
      payloadCell.storeRef(cell);

      if (i === dataPackageChunks.length) {
        break;
      }

      cell = beginCell();
    }

    lastCellIndex = payloadCellIndex;

    const dataPackageCell = createDataPackageCell(dataPackageChunks[i]);
    cell.storeRef(dataPackageCell);
  }

  return payloadCell.endCell();
}

export function createDataPackageCell(dataPackageHex: string) {
  const data = dataPackageHex.substring(
    0,
    dataPackageHex.length - 2 * SIGNATURE_BS
  );
  const signature = dataPackageHex.substring(
    dataPackageHex.length - 2 * SIGNATURE_BS,
    dataPackageHex.length
  );

  const v = BigInt("0x" + signature.substring(128, 130));
  assert([27, 28].map(BigInt).includes(v), `Wrong signature 'v' value (${v})`);

  const signatureCell = beginCell()
    .storeUint(BigInt("0x" + signature.substring(0, 64)), 256)
    .storeUint(BigInt("0x" + signature.substring(64, 128)), 256)
    .storeUint(v, 8)
    .endCell();

  console.assert(data.length / 2 <= 127, "Must be implemented for larger data");

  const dataCell = beginCell()
    .storeBuffer(Buffer.from(arrayify("0x" + data)))
    .endCell();

  return beginCell()
    .storeSlice(signatureCell.beginParse())
    .storeRef(dataCell)
    .endCell();
}
