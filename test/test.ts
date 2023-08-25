import { expect } from 'chai'
import { deployments, ethers, network, upgrades } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time, mine } from '@nomicfoundation/hardhat-network-helpers'
import { BigNumber } from 'ethers'
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import { whitelistAddr } from './whitelist'
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
        white_startTime: Math.floor(Date.now() / 1000), // ..
        white_endTime: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60, // ..
        startTime: Math.floor(Date.now() / 1000), // ..
        endTime: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60, // ..
      }

      const tree = StandardMerkleTree.of(whitelistAddr, ['address'])
      console.log('Merkle Root:', tree.root)
      let merkleProof

      merkleProof = [ // Mock merkleProof
      '0x39f1d0f74e1b9c500276795ae3ba24d2ccf74a0fcccc199441bb8c5a0af3a33f',
      '0x185e207b058bfe0e81ccb7ede04d62e6dcbea63fc39719199bcaf4366e1a3ad3',
      '0x39bf0795620cd5b0362712849192207caea1a338bb086541bc666fdce5bb8f9f',
      '0xbf00100e5baa01a583ffb5bbede4ea90635e29a1bde0474dfc0116aa74a85d24',
      '0xab90c5479b80775b45e33d899feed0eaea40f9884a3b698a315313f22c17130f',
      '0xaa971c3007a9a86d0fbc9d002aa2127a890be5ffd2bf15b63f4144618f472d17',
      '0x233a519b5f8a9464ebc7a8ea76df54ec6ff44cc533d18fe2ccbf430fbc3836f3'
    ]

    for (const [i, v] of tree.entries()) {
      if (v[0] === bob.address) {
        merkleProof = tree.getProof(i)
        console.log('Value:', v)
        console.log('Proof:', merkleProof)
      }
    }

      await OpBombPresale.initialize(PresaleConfig, OpBombRouter.address)
      await OpBombPresale.setMerkleRoot(tree.root)
      // Contribute 1 ETH to Presale
      await OpBombPresale.connect(alice).contribute(merkleProof!, {
        value: ethers.utils.parseEther('0.5'),
      })

      await OpBombPresale.connect(bob).contribute(merkleProof!, {
        value: ethers.utils.parseEther('0.5'),
      })

      await expect(
        OpBombPresale.connect(owner).contribute(merkleProof!, {
          value: ethers.utils.parseEther('1'),
        }),
      ).to.be.reverted

      const viewClaimableAmount = await OpBombPresale.connect(
        bob,
      ).viewClaimableAmount(merkleProof!)
      console.log('viewClaimableAmount', viewClaimableAmount)
      console.log('owner', bob.address)

      let whiteLister = await OpBombPresale.connect(owner).whiteLister(
        merkleProof!,
      )
      console.log('whiteLister', whiteLister)

      // whiteLister = await OpBombPresale.connect(bob).whiteLister(
      //   merkleProof!,
      // )
      // console.log('whiteLister', whiteLister)

      await OpBombPresale.closePresale()
      await expect(OpBombPresale.connect(bob).claim(merkleProof!)).to.be
        .reverted

      // await OpBombPresale.addLiquidityOnOpBomb()
      await OpBombPresale.setPresaleLiquidityAdded()

      await OpBombPresale.connect(alice).claim(merkleProof!)
      await OpBombPresale.connect(bob).claim(merkleProof!)

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
