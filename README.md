# SLICE


SLICE is a protocol that is composable with any kind of underlying yield-generating protocol (Aave, Compound, Yearn).

The idea is to transform the underlying strategy e.g. aDAI, cUSDC, yvUSDT into two subpools

1. A fixed pool where investors earn a stable yield on the underlying asset of the pool until a given maturity 
2. A leveraged pool where investor earn a variable yield on the same underlying asset until the same maturity date

Thus, SLICE subpools has the following characteristics : 1) underlying pool or asset 2) date of maturity 3) fixed yield over the period 

#A) Main agents
These pools are created without third party liquidity providers. It means that solvency is only insured by the parametrization of the relation between fixed and leverage pools.

To do so, we introduce the leverage factor. This parameter accounts for the leverage taken by leverage pool holders or in other words the factor between principal amount held in fixed pool vs. principal amount held in leveraged pool. 

At every pool creation, a leverage factor interval will be settled. It means that amount of leverage vs. principal cannot exceed the interval thresholds.


1) Leveraged pool holders
Yield depends on the effective yield of the underlying pool and the leverage factor.
The formula is : max(-1,(effective yield - fixed yield)* leverage factor). 

2) Fixed pool holders

Fixed pool holders will earn a fixed yield until maturity date as long as leveraged pool holders are not insolvent. If this unlikely event (leveraged pool insolvency) happens, the fixed pool holders will no longer earn a fixed yield but rather a variable yield. The principal amount is never in danger.
Insolvency means that collateral of leverage pools holders has been exhausted to maintain fixed pool holders interest rate.


#B) Pool lifecycle 
We will breakdown the life of a subpool in four stages

0) Pool creation
Someone creates a pool with a given underlying asset, maturity, leverage factor min and max and fixed yield over the period.

1) Bootstrap period
This is a n-days period during which investors give their interest in investing in a fixed or leveraged pool that has just been created. This period helps to constitute a decent liquidity amount for subpools and solve the chicken and egg problem of answering the leverage factor interval requirement. 
At the end of the bootstrap period, we keep the max amount of combined liquidity that enters the leverage factor requirement.

2) After bootstrap
After the boostrap period, investors can still redeem or invest in the subpools as long as it respects the leverage factor requirements. 

3) Pool ending
After the maturity date being reached, yields and principal are given back to the investors (in the future : reinvested automatically in other pools at the discretion of the investor)

#C) Analytics

In order to facilitate pool creation and the understanding of the risk solvency we provide metrics about expected pools risk metrics.

These metrics are computed thanks to an interest rate model (Vasicek) with a data calibration over historical data of Aave pools (from Aave api) 

It consists in mean yield and adverse yield. 
Mean yield : Mean expected junior yield based on 1,000 interest rates path simulations 
Adverse yield : quantile 0.95 (i.e. the 50th worst case scenario) of the junior yield

#D) Composability 
For the moment we have only implemented the protocol over Aave pools. However, we plan to make it generic in order to implement it over Compound, Yearn or any yield generating protocol using ERC-4626 standard.
