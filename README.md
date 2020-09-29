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
  - [**Controller**](./contracts/libraries/vaults/Controller.sol): Controls reward distributions to rewarded vaults.
  - [**Vault**](./contracts/libraries/vaults/Vault.sol): YEarn's style vault that collect assets to earn yield.
  - [**RewardedVault**](./contracts/libraries/vaults/RewardedVault.sol): A vault that can distribute rewards for a seperate reward token.
  - [**StrategyCurveRenBTC**](./contracts/libraries/vaults/StrategyCurveRenBTC.sol): An earning strategy for Curve.fi's renCrv vault.
  
## Beta Environment
- ACoconut: [0xD104F7479117209c1B885390500f29110f84E8FB](https://etherscan.io/address/0xD104F7479117209c1B885390500f29110f84E8FB)
- ACoconutBTC: [0x3644B1464Cc0ADb73AcC936dc6C4d5dDE42D108b](https://etherscan.io/address/0x3644B1464Cc0ADb73AcC936dc6C4d5dDE42D108b)
- Controller: [0x9003b72161870A49F2e12C9cC161527aea9133d7](https://etherscan.io/address/0x9003b72161870A49F2e12C9cC161527aea9133d7)
- ACoconutVault: [0xbDB15b5E88698c2DCfb6bFB7eb65fDEA36238055](https://etherscan.io/address/0xbDB15b5E88698c2DCfb6bFB7eb65fDEA36238055)
- StrategyCurveRenBTC: [0x3c5900C18Ee4d054149f49238138c806488449d2](https://etherscan.io/address/0x3c5900C18Ee4d054149f49238138c806488449d2)
- AccountFactory: [0x7583a7a3852f742bBC66855F3502f1c512a0aD6E](https://etherscan.io/address/0x7583a7a3852f742bBC66855F3502f1c512a0aD6E)
- StakingApplication: [0x66386885C7fb8B81126c58C3F5Ea533fC472139e](https://etherscan.io/address/0x66386885C7fb8B81126c58C3F5Ea533fC472139e)
