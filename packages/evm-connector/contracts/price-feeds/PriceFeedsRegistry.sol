// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./PriceFeed.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

contract PriceFeedsRegistry {
  using EnumerableMap for EnumerableMap.UintToAddressMap;
  using EnumerableSet for EnumerableSet.Bytes32Set;

  EnumerableMap.UintToAddressMap private priceFeedsContracts;

  bytes32[] public initialDataFeedsIds = [
    bytes32("BTC"),
    bytes32("ETH"),
    bytes32("AVAX"),
    bytes32("USDT"),
    bytes32("USDC"),
    bytes32("BUSD"),
    bytes32("LINK"),
    bytes32("GMX"),
    bytes32("PNG"),
    bytes32("QI"),
    bytes32("JOE"),
    bytes32("YAK"),
    bytes32("PTP")
  ];

  address private owner;

  constructor(address owner_) {
    owner = owner_;

    for (uint256 i = 0; i < initialDataFeedsIds.length; i++) {
      EnumerableMap.set(
        priceFeedsContracts,
        uint256(initialDataFeedsIds[i]),
        address(
          new PriceFeed(
            address(this),
            initialDataFeedsIds[i],
            string(
              abi.encodePacked(
                "RedStone price feed for ",
                string(abi.encodePacked(initialDataFeedsIds[i]))
              )
            )
          )
        )
      );
    }
  }

  modifier _onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  function getPriceFeedContractAddress(bytes32 dataFeedId) public view returns (address) {
    return EnumerableMap.get(priceFeedsContracts, uint256(dataFeedId));
  }

  function getDataFeeds() public view returns (bytes32[] memory) {
    return keys(priceFeedsContracts._inner);
  }

  function addDataFeed(bytes32 dataFeedId) public _onlyOwner {
    EnumerableMap.set(
      priceFeedsContracts,
      uint256(dataFeedId),
      address(
        new PriceFeed(
          address(this),
          dataFeedId,
          string(
            abi.encodePacked("RedStone price feed for ", string(abi.encodePacked(dataFeedId)))
          )
        )
      )
    );
  }

  function removeDataFeed(bytes32 dataFeedId) public _onlyOwner {
    EnumerableMap.remove(priceFeedsContracts, uint256(dataFeedId));
  }

  /**
   * TAKEN FROM https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableMap.sol#L167
   * MERGED TO MAIN BUT NOT PUBLISHED
   *
   * @dev Return the an array containing all the keys
   *
   * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
   * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
   * this function has an unbounded cost, and using it as part of a state-changing function may render the function
   * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
   */
  function keys(EnumerableMap.Bytes32ToBytes32Map storage map)
    internal
    view
    returns (bytes32[] memory)
  {
    return map._keys.values();
  }
}
