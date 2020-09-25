# ACoconut BTC(acBTC)

## Contracts
**Account**
- [**Account**](./contracts/account/Account.sol): User-owned smart contract accounts.
- [**AccountFactory**](./contracts/account/AccountFactory.sol): Factory to create new smart contract account.

**ACoconut**
- [**ACoconut**](./contracts/acoconut/ACoconut.sol): ACoconut goverance token.
- [**ACoconutBTC**](./contracts/acoconut/ACoconutBTC.sol): ACoconut BTC which is a synthetic BTC ERC20 token backed by a basket of BTC ERC20 tokens.
- [**ACoconutExchange**](./contracts/acoconut/ACoconutExchange.sol): An BTC ERC20 token exchange that bootstraps the value of ACoconutBTC.
- [**ACoconutExchangeProxy**](./contracts/acoconut/ACoconutExchangeProxy.sol): Proxy for ACoconutExchangeProxy
- [**ACoconutVault**](./contracts/acoconut/ACoconutVault.sol): Vault that earns yield as well as helping migration into ACoconutExchange.
- [**CurveRenCrvMigrator**](./contracts/acoconut/CurveRenCrvMigrator.sol): Migrates Curve.fi's RenCrv into ACoconutExchange.

**Application**
- [**StakingApplication**](./contracts/applications/StakingApplication.sol): Application that helps staking and claiming rewards.

**Libraries**
- **Curve**: Curve.fi's interfaces
- **Uniswap**: Uniswap's interfaces
- **Vault**
  - [**Vault**](./contracts/libraries/vaults/Vault.sol): YEarn's style vault that collect assets to earn yield.
  - [**RewardedVault**](./contracts/libraries/vaults/RewardedVault.sol): A vault that can distribute rewards for a seperate reward token.
  - [**StrategyCurveRenBTC**](./contracts/libraries/vaults/StrategyCurveRenBTC.sol): An earning strategy for Curve.fi's renCrv vault.
  
## Beta Environment
- ACoconut: [0xb74e3ca8401B5b9E09d46B4000f869231f2f4A79](https://etherscan.io/address/0x6fc74994b7fccd054759fd70459c850dfb7c3b31)
- ACoconutBTC: [0xb74e3ca8401B5b9E09d46B4000f869231f2f4A79](https://etherscan.io/address/0xb74e3ca8401B5b9E09d46B4000f869231f2f4A79)
- ACoconutVault: [0xE5B5C8D47E9E1910D69C113a02d55c2091Bf06D1](https://etherscan.io/address/0xE5B5C8D47E9E1910D69C113a02d55c2091Bf06D1)
- StrategyCurveRenBTC: [0x32A43c918e6a814263bc9509C06fa83cE9E5139b](https://etherscan.io/address/0x32A43c918e6a814263bc9509C06fa83cE9E5139b)
- AccountFactory: [0x27ee601bf94969f112487FF13acb6856Ec86C8A2](https://etherscan.io/address/0x27ee601bf94969f112487FF13acb6856Ec86C8A2)
- StakingApplication: [0xBfE13cB6e2731e4740424804e86E5D8251E4CaE5](https://etherscan.io/address/0xBfE13cB6e2731e4740424804e86E5D8251E4CaE5)
