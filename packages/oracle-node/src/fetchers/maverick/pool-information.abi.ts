export const MAVERICK_POOL_INFORMATION_ABI = [
  "function getSqrtPrice(address pool) external view returns (uint256 sqrtPrice)",
  "function calculateSwap(address pool, uint128 amount, bool tokenAIn, bool exactOutput, uint256 sqrtPriceLimit) external returns (uint256 returnAmount)",
];
