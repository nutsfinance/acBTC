# acBTC

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
