# Compare historical cryptocurrencies prices form any provider to redstone api

This script allows you to compare historical prices (on any cryptocurrency/USD pair) between redstone api
and other providers such as chainlink.

## 📜 Instructions

- Set cryptocurriences and provider (for example "ETH", "chainlink") - commented fields
  in files from folder redstone-oracles-monorepo/packages/oracle-node/scripts
- Open terminal in folder: redstone-oracles-monorepo/packages/oracle-node
- Use following commands:
- yarn query-historical-prices
- yarn reformat-json-results
- yarn query-specific-redstone-api-prices
- phyton3 scripts/price-comparison.py
- price-comparison.png ilustrate deviation in prices over time (redstone api compared to other provider)

### Process view

Using commands above will fetch historical prices from second provider, format it, fetch
corresponding prices from redstone api and generate file named price-comparison.png

## Data format

The historical prices are represented as a single JSON object

```js
[
{"price":10.96,"timestamp":1662561318}
{"price":11.23,"timestamp":1662572192}
]
```
