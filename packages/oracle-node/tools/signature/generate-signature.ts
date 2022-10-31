import { utils, Wallet } from "ethers";

(async () => {
  const timestamp = 1654353400000;
  const privateKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const signer = new Wallet(privateKey);
  console.log(`address: ${signer.address}`);
  const message = timestamp.toString();
  const signature = await signer.signMessage(message);
  const recoveredAddress = utils.verifyMessage(message, signature);
  console.log(`signature: ${signature}`);
  console.log(`recoveredAddress: ${recoveredAddress}`);
})();

/* Another method to calculate signature and recover address
  const digest = utils.keccak256(utils.toUtf8Bytes(timestamp.toString()));
  const signingKey = new utils.SigningKey(privateKey);
  const signature = signingKey.signDigest(digest);
  coins fullSignature = utils.joinSignature(signature)
  console.log(`signature: ${fullSignature}`);
  const publicKey = utils.recoverPublicKey(digest, signature);
  const address = utils.computeAddress(publicKey));
*/
