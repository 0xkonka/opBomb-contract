import { expect } from 'chai'
import { deployments, ethers, upgrades } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from 'ethers'
import { keccak256, toBuffer, ecsign, bufferToHex } from 'ethereumjs-util'
import {
  OpBombFactory, OpBombRouter, MockERC20, WBNB, OpBombPair, IOpBombPair
} from '../typechain'
import { execPath } from 'process'

describe('test DEX', function () {
  // Account
  let owner: SignerWithAddress
  let feeManager: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress

  // Contract
  let OpBombFactory: OpBombFactory
  let OpBombRouter: OpBombRouter
  let token1: MockERC20
  let token2: MockERC20
  let token3: MockERC20
  let WBNB: WBNB

  before(async () => {
    const signers = await ethers.getSigners()
    owner = signers[0]
    feeManager = signers[1]
    alice = signers[2]
    bob = signers[3]

    // Deploy tokens
    let receipt = await deployments.deploy('MockERC20', {
      from: owner.address,
      args: [
        "Token1", "Token1", "1000000"
      ],
      log: true,
    })
    token1 = await ethers.getContractAt('MockERC20', receipt.address)
    receipt = await deployments.deploy('MockERC20', {
      from: owner.address,
      args: [
        "Token2", "Token2", "1000000"
      ],
      log: true,
    })
    token2 = await ethers.getContractAt('MockERC20', receipt.address)
    receipt = await deployments.deploy('MockERC20', {
      from: owner.address,
      args: [
        "Token3", "Token3", "1000000"
      ],
      log: true,
    })
    token3 = await ethers.getContractAt('MockERC20', receipt.address)
    receipt = await deployments.deploy('WBNB', {
      from: owner.address,
      log: true,
    })
    WBNB = await ethers.getContractAt('WBNB', receipt.address)

    // Deploy factory

    receipt = await deployments.deploy('OpBombFactory', {
      from: owner.address,
      args: [feeManager.address],
      log: true,
    })
    OpBombFactory = await ethers.getContractAt('OpBombFactory', receipt.address)
    // Deploy Router
    receipt = await deployments.deploy('OpBombRouter', {
      from: owner.address,
      args: [OpBombFactory.address, WBNB.address],
      log: true,
    })
    OpBombRouter = await ethers.getContractAt('OpBombRouter', receipt.address)


  })
  describe('Deploy contract', async () => {
    it('should be deployed', async () => { })
  })
  describe('Mint token', async () => {
    it('Mint token', async function () {
      // Mint Grape token
      // await grape.mint(
      //   owner.address,
      //   BigNumber.from(1000000).mul(BigNumber.from(10).pow(18)),
      // )
      await token1.connect(owner).transfer(bob.address, "2000");
      await token2.connect(owner).transfer(bob.address, "2000");
      await token3.connect(owner).transfer(bob.address, "2000");

      await token1.connect(owner).transfer(alice.address, "2000");
      await token2.connect(owner).transfer(alice.address, "2000");
      await token3.connect(owner).transfer(alice.address, "2000");

    })
    it('Add Liquidity', async function () {
      
      await OpBombFactory.createPair(token1.address, token2.address);
      const deadline = Date.now() + 20;

      await token1.connect(alice).approve(OpBombRouter.address, "100");
      await token2.connect(alice).approve(OpBombRouter.address, "1000");

      await OpBombRouter.connect(alice).addLiquidity(token1.address, token2.address, "100", "1000", 0, 0, alice.address, deadline);

      await token1.connect(bob).approve(OpBombRouter.address, "100");
      await token3.connect(bob).approve(OpBombRouter.address, "2000");

      await OpBombRouter.connect(bob).addLiquidity(token1.address, token3.address, "100", "2000", 0, 0, bob.address, deadline);

    })
    it('Swap', async function () {
      const deadline = Date.now() + 20;
      let path = [token1.address, token2.address];

      let pair = await OpBombFactory.getPair(token1.address, token2.address);

      console.log('pair.address', pair)
      let OpBombPair = await ethers.getContractAt('OpBombPair', pair)
      const poolTotalSupply = await OpBombPair.totalSupply();
      const reserve = await OpBombPair.getReserves()
      console.log('poolTotalSupply',  +poolTotalSupply)
      console.log('reserve', reserve)

      await token1.connect(alice).approve(OpBombRouter.address, BigNumber.from(1000));
      await token2.connect(alice).approve(OpBombRouter.address, BigNumber.from(1000));
      const amounts = await OpBombRouter.getAmountOut("10", reserve._reserve0, reserve._reserve1, 500);
      console.log('amounts', amounts)
      await OpBombRouter.connect(alice).swapExactTokensForTokens(BigNumber.from(10), BigNumber.from(86) , path, alice.address, deadline);
      // const ownerGrapeBalance = await grape.balanceOf(owner.address)
      // expect(await grape.totalSupply()).to.equal(ownerGrapeBalance)
    })
  })
})
