# ACoconut BTC(acBTC)

Welcome to ACoconut BTC/acBTC! ACoconut BTC is a synthetic ERC20 BTC token backed by a basket of ERC20 BTC tokens. It’s built on top of Curve’s StableSwap algorithm and it's integrated with saving and swap applications. For more information about acBTC, please check our [docs](https://docs.acbtc.fi/) or visit our [DApp](https://app.acbtc.fi/).

## Audits
### Phase 1
All smart contracts, except [**ACoconutExchange**](./contracts/acoconut/ACoconutExchange.sol) and [**CurveRenCrvMigrator**](./contracts/acoconut/CurveRenCrvMigrator.sol), have been reviewed thoroughly by [Secbit Labs](https://secbit.io/).
 - [Phase 1 Audit Report(EN)](./audits/acBTC_Phase_One_Report_EN.pdf)
 - [Phase 1 Audit Report(CN)](./audits/acBTC_Phase_One_Report_CN.pdf)

### Phase 2
All smart contracts have been reviewed by thoroughly by [Secbit Labs](https://secbit.io/). 
 - [Phase 2 Audit Report(EN)](./audits/acBTC_Phase_Two_Report_EN.pdf)
 - [Phase 2 Audit Report(CN)](./audits/acBTC_Phase_Two_Report_CN.pdf)

## Contracts

**ACoconut**
- [**ACoconut**](./contracts/acoconut/ACoconut.sol): ACoconut goverance token.
- [**ACoconutBTC**](./contracts/acoconut/ACoconutBTC.sol): ACoconut BTC which is a synthetic BTC ERC20 token backed by a basket of BTC ERC20 tokens.
- [**ACoconutSwap**](./contracts/acoconut/ACoconutSwap.sol): An BTC ERC20 token exchange that bootstraps the value of ACoconutBTC.
- [**ACoconutSwapProxy**](./contracts/acoconut/ACoconutSwapProxy.sol): Proxy for ACoconutExchangeProxy
- [**ACoconutMaker**](./contracts/acoconut/ACoconutMaker.sol): ACoconutSwap fee collector and distributor.
- [**ACoconutVault**](./contracts/acoconut/ACoconutVault.sol): Vault that earns yield as well as helping migration into ACoconutExchange.
- [**CurveRenCrvMigrator**](./contracts/acoconut/CurveRenCrvMigrator.sol): Migrates Curve.fi's RenCrv into ACoconutExchange.

**Application**
- [**StakingApplication**](./contracts/applications/StakingApplication.sol): Application that helps staking and claiming rewards.
- [**SwapApplication**](./contracts/applications/SwapApplication.sol): Application that helps mint, redeem and swap acBTC.

**Account**
- [**Account**](./contracts/account/Account.sol): User-owned smart contract accounts.
- [**AccountFactory**](./contracts/account/AccountFactory.sol): Factory to create new smart contract account.

**Vault**
- [**Controller**](./contracts/libraries/vaults/Controller.sol): Controls reward distributions to rewarded vaults.
- [**Vault**](./contracts/libraries/vaults/Vault.sol): YEarn's style vault that collect assets to earn yield.
- [**RewardedVault**](./contracts/libraries/vaults/RewardedVault.sol): A vault that can distribute rewards for a seperate reward token.
- [**StrategyCurveRenBTC**](./contracts/libraries/vaults/StrategyCurveRenBTC.sol): An earning strategy for Curve.fi's renCrv vault.
  
## Deployments
- ACoconut: [0x9A0aBA393aac4dFbFf4333B06c407458002C6183](https://etherscan.io/address/0x9A0aBA393aac4dFbFf4333B06c407458002C6183)
- ACoconutBTC: [0xeF6e45af9a422c5469928F927ca04ed332322e2e](https://etherscan.io/address/0xeF6e45af9a422c5469928F927ca04ed332322e2e)
- ACoconutSwap(Proxy): [0x73FddFb941c11d16C827169Bb94aCC227841C396](https://etherscan.io/address/0x73FddFb941c11d16C827169Bb94aCC227841C396)
- ACoconutMaker: [0x02b909adc8921c83c00516d39faaaaa2d84eea77](https://etherscan.io/address/0x02b909adc8921c83c00516d39faaaaa2d84eea77)
- Controller: [0xFA25316494560fbEc71F147aDCD6BE34C7aB7AE5](https://etherscan.io/address/0xFA25316494560fbEc71F147aDCD6BE34C7aB7AE5)
- ACoconutVault
  - acBTC Vault: [0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45](https://etherscan.io/address/0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45)
  - UNI-ETH-AC Vault: [0xF2c6706af78d15549c9376d04E40957A3B357de4](https://etherscan.io/address/0xf2c6706af78d15549c9376d04e40957a3b357de4)
- StrategyCurveRenBTC: [0x73D6df4395CD54DF2E07fD3880c1B47Aeb2Aed97](https://etherscan.io/address/0x73D6df4395CD54DF2E07fD3880c1B47Aeb2Aed97)
- AccountFactory: [0x34d50B679Bb74a3d4D27A82594e527Aea78ec548](https://etherscan.io/address/0x34d50B679Bb74a3d4D27A82594e527Aea78ec548)
- StakingApplication: [0xc34a8AfBbC912feB57881CD033825E9a199CF6Bf](https://etherscan.io/address/0xc34a8AfBbC912feB57881CD033825E9a199CF6Bf)
- SwapApplication: [0x4cfFc147F4E5d6227D3adBa93bBa7d8bba124bA5](https://etherscan.io/address/0x4cfFc147F4E5d6227D3adBa93bBa7d8bba124bA5)
- Timelock: [xeD4907815Ff134A50B50f73090f293f22F1FD51e](https://etherscan.io/address/xeD4907815Ff134A50B50f73090f293f22F1FD51e)
