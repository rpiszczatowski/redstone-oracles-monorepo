// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../data-services/KydServiceConsumerBase.sol";

contract SampleLensReactionsConsumer is KydServiceConsumerBase {
  error UserDidNotPassReactions(uint256 postId);

  uint256 passedOracleData;

  function executeActionPassingLensReactions(uint256 postId) public {
    bytes32 dataFeedId = keccak256(abi.encodePacked(postId));
    uint256 reactions = getOracleNumericValueFromTxMsg(dataFeedId);
    passedOracleData = reactions;
  }
  

  function getPassedOracleData() public view returns (uint256) {
    return passedOracleData;
  }
}
