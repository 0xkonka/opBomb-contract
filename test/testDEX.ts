import { expect } from 'chai'
import { deployments, ethers, upgrades } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from 'ethers'
import {
  keccak256,
  toBuffer,
  ecsign,
  bufferToHex,
  MAX_INTEGER,
} from 'ethereumjs-util'
import {
  OpBombFactory,
  OpBombRouter,
  MockERC20,
  WETH,
  OpBombPair,
  OpBombPresale,
  BombToken,
  SyrupBar,
} from '../typechain'
import { execPath } from 'process'

describe('test DEX', function () {
  // Account
  let owner: SignerWithAddress
  let feeManager: SignerWithAddress
  let controller: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress

  // Contract
  let OpBombFactory: OpBombFactory
  let OpBombRouter: OpBombRouter
  let token1: MockERC20
  let token2: MockERC20
  let token3: MockERC20
  let WETH: WETH
  let OpBombPresale: OpBombPresale
  let BombToken: BombToken
  let SyrupBar: SyrupBar

  before(async () => {
    const signers = await ethers.getSigners()
    owner = signers[0]
    feeManager = signers[1]
    alice = signers[2]
    bob = signers[3]
    controller = signers[4]

    // Deploy tokens
    let receipt = await deployments.deploy('WETH', {
      from: owner.address,
      log: true,
    })
    WETH = await ethers.getContractAt('WETH', receipt.address)
    receipt = await deployments.deploy('MockERC20', {
      from: owner.address,
      args: ['Token1', 'Token1', ethers.utils.parseEther('1000000')],
      log: true,
    })
    token1 = await ethers.getContractAt('MockERC20', receipt.address)
    receipt = await deployments.deploy('MockERC20', {
      from: owner.address,
      args: ['Token2', 'Token2', ethers.utils.parseEther('1000000')],
      log: true,
    })
    token2 = await ethers.getContractAt('MockERC20', receipt.address)
    receipt = await deployments.deploy('MockERC20', {
      from: owner.address,
      args: ['Token3', 'Token3', ethers.utils.parseEther('1000000')],
      log: true,
    })
    token3 = await ethers.getContractAt('MockERC20', receipt.address)
    // Deploy Bomb Token
    receipt = await deployments.deploy('BombToken', {
      from: owner.address,
      log: true,
    })
    BombToken = await ethers.getContractAt('BombToken', receipt.address)
    // Deploy Bomb Token
    receipt = await deployments.deploy('SyrupBar', {
      from: owner.address,
      args: [BombToken.address],
      log: true,
    })
    SyrupBar = await ethers.getContractAt('SyrupBar', receipt.address)
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
      args: [OpBombFactory.address, WETH.address],
      log: true,
    })
    OpBombRouter = await ethers.getContractAt('OpBombRouter', receipt.address)
    // Deploy Presale
    receipt = await deployments.deploy('OpBombPresale', {
      from: owner.address,
      log: true,
    })
    OpBombPresale = await ethers.getContractAt('OpBombPresale', receipt.address)
  })
  describe('Deploy contract', async () => {
    it('should be deployed', async () => {})
  })
  describe('Dex', async () => {
    it('Initialize', async function () {
      await BombToken.mint(owner.address, ethers.utils.parseEther('10000'))
      await BombToken.mint(alice.address, ethers.utils.parseEther('10000'))
      await BombToken.mint(bob.address, ethers.utils.parseEther('10000'))
      await BombToken.mint(
        OpBombPresale.address,
        ethers.utils.parseEther('10000'),
      )
      await OpBombFactory.connect(feeManager).setFeeTo(feeManager.address)
    })
    it('Transfer token', async function () {
      await token1
        .connect(owner)
        .transfer(bob.address, ethers.utils.parseEther('20000'))
      await token2
        .connect(owner)
        .transfer(bob.address, ethers.utils.parseEther('20000'))
      await token3
        .connect(owner)
        .transfer(bob.address, ethers.utils.parseEther('20000'))

      await token1
        .connect(owner)
        .transfer(alice.address, ethers.utils.parseEther('20000'))
      await token2
        .connect(owner)
        .transfer(alice.address, ethers.utils.parseEther('20000'))
      await token3
        .connect(owner)
        .transfer(alice.address, ethers.utils.parseEther('20000'))

      await WETH.connect(owner).deposit({
        value: ethers.utils.parseEther('100'),
      })
      await WETH.connect(alice).deposit({
        value: ethers.utils.parseEther('100'),
      })
      await WETH.connect(bob).deposit({ value: ethers.utils.parseEther('100') })
    })
    it('Add Liquidity', async function () {
      // ETH/token1 1: 60
      await token1
        .connect(bob)
        .approve(OpBombRouter.address, ethers.utils.parseEther('3000'))
      await OpBombRouter.connect(bob).addLiquidityETH(
        token1.address,
        ethers.utils.parseEther('3000'),
        0,
        0,
        bob.address,
        ethers.constants.MaxUint256,
        { value: ethers.utils.parseEther('50') },
      )
      // WETH/token1 1: 60
      await WETH.connect(bob).approve(
        OpBombRouter.address,
        ethers.utils.parseEther('50'),
      )
      await token1
        .connect(bob)
        .approve(OpBombRouter.address, ethers.utils.parseEther('3000'))
      await OpBombRouter.connect(bob).addLiquidity(
        WETH.address,
        token1.address,
        ethers.utils.parseEther('50'),
        ethers.utils.parseEther('3000'),
        0,
        0,
        bob.address,
        ethers.constants.MaxUint256,
      )

      // token1/token2 10:1000
      await token1
        .connect(alice)
        .approve(OpBombRouter.address, ethers.utils.parseEther('1000'))
      await token2
        .connect(alice)
        .approve(OpBombRouter.address, ethers.utils.parseEther('10000'))
      await OpBombRouter.connect(alice).addLiquidity(
        token1.address,
        token2.address,
        ethers.utils.parseEther('1000'),
        ethers.utils.parseEther('10000'),
        0,
        0,
        alice.address,
        ethers.constants.MaxUint256,
      )
    })
    it('Swap ETH to Token1', async function () {
      let path = [WETH.address, token1.address]

      // Swap token1 10 to token2
      const amounts = await OpBombRouter.getAmountsOut(
        ethers.utils.parseEther('1'),
        path,
      )

      await OpBombRouter.connect(alice).swapExactETHForTokens(
        amounts[1],
        path,
        alice.address,
        ethers.constants.MaxUint256,
        { value: ethers.utils.parseEther('1') },
      )
    })
    it('Swap Token1 to Token2', async function () {
      let path = [token1.address, token2.address]

      // let reserve = await OpBombPair.getReserves()
      // console.log('reserve1', reserve)

      // Swap token1 10 to token2
      const amounts = await OpBombRouter.getAmountsOut(
        ethers.utils.parseEther('100'),
        path,
      )

      await token1
        .connect(alice)
        .approve(OpBombRouter.address, ethers.utils.parseEther('100'))
      await OpBombRouter.connect(alice).swapExactTokensForTokens(
        ethers.utils.parseEther('100'),
        amounts[1],
        path,
        alice.address,
        ethers.constants.MaxUint256,
      )

      // reserve = await OpBombPair.getReserves()
      // console.log('reserve2', reserve)
    })
    it('Swap ETH to Token1', async function () {
      let path = [WETH.address, token1.address]

      // Swap WETH 10 to token1
      const amounts = await OpBombRouter.getAmountsOut(
        ethers.utils.parseEther('1'),
        path,
      )
      await WETH.connect(bob).approve(
        OpBombRouter.address,
        ethers.utils.parseEther('10'),
      )
      await OpBombRouter.connect(bob).swapExactTokensForTokens(
        ethers.utils.parseEther('1'),
        amounts[1],
        path,
        bob.address,
        ethers.constants.MaxUint256,
      )
    })
    it('Presale', async function () {
      let PresaleConfig = {
        token: BombToken.address, // OpBomb token address
        price: ethers.utils.parseEther('333.33'), //  0.015
        listing_price: ethers.utils.parseEther('266.66'), // 0.01875
        liquidity_percent: 50, // 50%
        hardcap: ethers.utils.parseEther('2'), // 100 ETH
        softcap: ethers.utils.parseEther('1'), // 150 ETH
        min_contribution: ethers.utils.parseEther('0.1'), // 1 ETH
        max_contribution: ethers.utils.parseEther('1'), // 5 ETH
        startTime: Math.floor(Date.now() / 1000) + 20, // ..
        endTime: Math.floor(Date.now() / 1000) + 20 + 3 * 24 * 60 * 60, // ..
        liquidity_lockup_time: 3 * 24 * 60 * 60, // ex: 1 mont
      }

      await OpBombPresale.initialize(
        PresaleConfig,
        OpBombRouter.address,
        owner.address,
        feeManager.address,
        500,
        0,
        0,
      )

      // Contribute 1 ETH to Presale
      await OpBombPresale.connect(alice).contribute({
        value: ethers.utils.parseEther('1'),
      })

      await OpBombPresale.connect(bob).contribute({
        value: ethers.utils.parseEther('1'),
      })
      await expect(
        OpBombPresale.connect(owner).contribute({
          value: ethers.utils.parseEther('1'),
        }),
      ).to.be.reverted

      // await OpBombPresale.connect(bob).emergencyWithdraw()
      // await OpBombPresale.connect(bob).contribute({
      //   value: ethers.utils.parseEther('5'),
      // })

      const totalHold = await OpBombPresale.totalSold()
      const totalRaised = await OpBombPresale.totalRaised()
      console.log('totalHold  ', totalHold)
      console.log('totalRaised', totalRaised)

      await OpBombPresale.closePresale()
      await OpBombPresale.connect(bob).withdraw()
      await OpBombPresale.connect(alice).withdraw()

      const aliceBal = await BombToken.balanceOf(alice.address)
      console.log('aliceBal', aliceBal)

      let path = [WETH.address, BombToken.address]

      const amounts = await OpBombRouter.getAmountsOut(
        ethers.utils.parseEther('0.00001'),
        path,
      )
      console.log('amounts', amounts)
    })
  })
})
