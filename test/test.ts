import { expect } from 'chai'
import { deployments, ethers, network, upgrades } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time, mine } from '@nomicfoundation/hardhat-network-helpers'
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
  MasterChef,
} from '../typechain'
import { execPath } from 'process'

describe('test', function () {
  // Account
  let owner: SignerWithAddress
  let feeManager: SignerWithAddress
  let controller: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress

  // Contract
  let token1: MockERC20
  let token2: MockERC20
  let token3: MockERC20
  let BombToken: BombToken
  let WETH: WETH

  let OpBombFactory: OpBombFactory
  let OpBombRouter: OpBombRouter
  let OpBombPresale: OpBombPresale
  let MasterChef: MasterChef
  let SyrupBar: SyrupBar

  // Constant
  const BombPerBlock = ethers.utils.parseEther('0.03')
  const startBlock = 0

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
    // Deploy Syrup
    receipt = await deployments.deploy('SyrupBar', {
      from: owner.address,
      args: [BombToken.address],
      log: true,
    })
    SyrupBar = await ethers.getContractAt('SyrupBar', receipt.address)
    // Deploy Farm
    receipt = await deployments.deploy('MasterChef', {
      from: owner.address,
      args: [
        BombToken.address,
        SyrupBar.address,
        feeManager.address,
        feeManager.address,
        BombPerBlock,
        startBlock,
      ],
      log: true,
    })
    MasterChef = await ethers.getContractAt('MasterChef', receipt.address)
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
    it('Swap WETH to Token1', async function () {
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
  })
  describe('Presale', async () => {
    it('Presale', async function () {
      let PresaleConfig = {
        token: BombToken.address, // OpBomb token address
        price: ethers.utils.parseEther('333.33'), //  0.015
        listing_price: ethers.utils.parseEther('266.66'), // 0.01875
        liquidity_percent: 50, // 50%
        hardcap: ethers.utils.parseEther('2'), // 100 ETH
        softcap: ethers.utils.parseEther('1'), // 150 ETH
        min_contribution: ethers.utils.parseEther('0.1'), // 1 ETH
        max_contribution: ethers.utils.parseEther('0.6'), // 5 ETH
        startTime: Math.floor(Date.now() / 1000), // ..
        endTime: Math.floor(Date.now() / 1000) + 20 + 3 * 24 * 60 * 60, // ..
        // liquidity_lockup_time: 3 * 24 * 60 * 60, // ex: 1 mont
      }

      await OpBombPresale.initialize(PresaleConfig, OpBombRouter.address)
      await OpBombPresale.setMerkleRoot(
        '0x876af87d2c2270871c553651eb0105b1c644c49943522d9e5d0cb2d95fc8386c',
      )
      const merkleProof = [
        '0x8c557369414fd9dd8ef546bce04855821e44e71d763aaa55501c23e0dbf38eeb',
        '0xae73d1fcbd53d6d09e655449c513f25ea6a566b9a557815c040fa6449a7de51e',
        '0xbf0b563da012c196209ac6e1cb6f868bdec1edbf75ca606d62c40fd0cb9c5072',
        '0x1afa38b8ea113d5542d4fd32efef112cc62a31098b6fffa2c92bd7a31a0e34c8',
        '0x33d5db91db078f829009bddae233e8232d7c6473728c44423467f194d70bb9d6',
        '0xf2ef4afe1fd45e111cf7a39fe47e6395d700369303744c8e259e90e51e906413',
      ]

      // Contribute 1 ETH to Presale
      await OpBombPresale.connect(alice).contribute({
        value: ethers.utils.parseEther('0.5'),
      })

      await OpBombPresale.connect(bob).contribute({
        value: ethers.utils.parseEther('0.5'),
      })
      await expect(
        OpBombPresale.connect(owner).contribute({
          value: ethers.utils.parseEther('1'),
        }),
      ).to.be.reverted

      const viewClaimableAmount = await OpBombPresale.connect(bob).viewClaimableAmount(
        merkleProof,
      )
      console.log('viewClaimableAmount', viewClaimableAmount)

      await OpBombPresale.closePresale()
      await expect(OpBombPresale.connect(bob).claim(merkleProof)).to.be.reverted

      // await OpBombPresale.addLiquidityOnOpBomb()
      await OpBombPresale.setPresaleFinished()

      await OpBombPresale.connect(alice).claim(merkleProof)
      await OpBombPresale.connect(bob).claim(merkleProof)

      // const aliceBal = await BombToken.balanceOf(alice.address)
      // console.log('aliceBal', aliceBal)

      // let pairAddr = await OpBombFactory.getPair(
      //   WETH.address,
      //   BombToken.address,
      // )
      // let pair : OpBombPair = await ethers.getContractAt('OpBombPair', pairAddr)

      // let path = [WETH.address, BombToken.address]
      // const amounts = await OpBombRouter.getAmountsOut(
      //   ethers.utils.parseEther('0.00001'),
      //   path,
      // )
      // console.log('amounts', amounts)
    })
  })
  describe('Farm', async () => {
    it('Initialize', async function () {
      await BombToken.transferOwnership(MasterChef.address)
      await SyrupBar.transferOwnership(MasterChef.address)

      // await BombToken.mint(feeManager.address, ethers.utils.parseEther('1'), {
      //   from: MasterChef.address,
      // })
    })
    it('add LP to farm', async function () {
      let LPAddr = await OpBombFactory.getPair(WETH.address, token1.address)
      await MasterChef.add(1000, LPAddr, 500, false)
      LPAddr = await OpBombFactory.getPair(token1.address, token2.address)
      await MasterChef.add(2000, LPAddr, 500, false)

      await MasterChef.set(1, 2000, 500, false)
    })
    it('deposit/withdraw', async function () {
      // Farm LP

      let BombBal = await BombToken.balanceOf(bob.address)
      console.log('BombBal', BombBal)

      let LPAddr = await OpBombFactory.getPair(WETH.address, token1.address)
      let OpBombPair = await ethers.getContractAt('OpBombPair', LPAddr)

      let bobLPBalbefore = await OpBombPair.balanceOf(bob.address)

      await OpBombPair.connect(bob).approve(MasterChef.address, bobLPBalbefore)
      await MasterChef.connect(bob).deposit(1, bobLPBalbefore)

      await mine(10000)

      let bobLPBal = await MasterChef.userInfo(1, bob.address)
      await MasterChef.connect(bob).withdraw(1, bobLPBal.amount)

      BombBal = await BombToken.balanceOf(bob.address)
      console.log('BombBal', BombBal)
    })
    it('enter/leavg staking', async function () {
      // Farm Bomb

      let BombBal = await BombToken.balanceOf(alice.address)
      console.log('BombBal1', BombBal)
      let SyrupBal = await SyrupBar.balanceOf(alice.address)
      console.log('SyrupBal1', SyrupBal)

      await BombToken.connect(alice).approve(MasterChef.address, BombBal)
      await MasterChef.connect(alice).enterStaking(BombBal)

      await mine(1000000)

      let enteredBal = await MasterChef.userInfo(0, alice.address)
      await expect(
        MasterChef.connect(alice).leaveStaking(
          BigNumber.from(enteredBal.amount).add(100),
        ),
      ).to.be.reverted
      await MasterChef.connect(alice).leaveStaking(enteredBal.amount)

      BombBal = await BombToken.balanceOf(alice.address)
      console.log('BombBal3', BombBal)
      SyrupBal = await SyrupBar.balanceOf(alice.address)
      console.log('SyrupBal3', SyrupBal)
    })
    it('emergency withdraw', async function () {
      // Farm Bomb

      let BombBal = await BombToken.balanceOf(bob.address)
      console.log('BombBal', BombBal)

      let LPAddr = await OpBombFactory.getPair(WETH.address, token1.address)
      let OpBombPair = await ethers.getContractAt('OpBombPair', LPAddr)

      let bobLPBalbefore = await OpBombPair.balanceOf(bob.address)

      await OpBombPair.connect(bob).approve(MasterChef.address, bobLPBalbefore)
      await MasterChef.connect(bob).deposit(1, bobLPBalbefore)

      await mine(10000)

      await MasterChef.connect(bob).emergencyWithdraw(1)

      BombBal = await BombToken.balanceOf(bob.address)
      console.log('BombBal', BombBal)
    })
  })
})
