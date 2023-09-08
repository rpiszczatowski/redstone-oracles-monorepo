import { utils } from "ethers";

const DEFAULT_DECIMALS = 15;
const BIGGER_DECIMALS = 21;
const SMALLER_DECIMALS = 10;
export const DEFAULT_AMOUNT = utils.parseUnits("1", DEFAULT_DECIMALS);
export const BIGGER_AMOUNT = utils.parseUnits("1", BIGGER_DECIMALS);
export const SMALLER_AMOUNT = utils.parseUnits("1", SMALLER_DECIMALS);
