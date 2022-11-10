# How to run redstone node locally for the first time

- Clone https://github.com/redstone-finance/redstone-oracles-monorepo
- Install dependencies using `yarn install` command
- Go to the oracle-node folder using `cd packages/oracle-node` command
- Run `yarn build`
- Populate `.env` file with env variables from `.env.example`, e.g. using the following comand: `cp .env.example .env`
- Run `yarn start:dev`
- Check the `tmp.out` file, it shoudl contain the node logs
