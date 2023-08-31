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
  NFT,
  GrenadeToken,
  BEP20TokenImplementation,
  BombToken,
  MasterChef,
} from '../typechain'
import { execPath } from 'process'

describe('test', function () {
  // Account
  let owner: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let oracle: SignerWithAddress

  // Contract
  let usdc: BEP20TokenImplementation
  let GrenadeToken: GrenadeToken
  let BombToken: BombToken
  let NFTContract: NFT
  let MasterChef: MasterChef

  // Constant
  const BombPerBlock = ethers.utils.parseEther('0.03')
  const startBlock = 0

  before(async () => {
    const signers = await ethers.getSigners()
    owner = signers[0]
    alice = signers[1]
    bob = signers[2]
    oracle = signers[3]

    // Deploy Bomb Token
    let receipt = await deployments.deploy('BombToken', {
      from: owner.address,
      log: true,
    })
    BombToken = await ethers.getContractAt('BombToken', receipt.address)
    // Deploy grenade Token
    receipt = await deployments.deploy('GrenadeToken', {
      from: owner.address,
      log: true,
    })
    GrenadeToken = await ethers.getContractAt('GrenadeToken', receipt.address)
    // Deploy usdc Token
    receipt = await deployments.deploy('BEP20TokenImplementation', {
      from: owner.address,
      log: true,
    })
    usdc = await ethers.getContractAt('BEP20TokenImplementation', receipt.address)
    // Deploy Masterchef
    receipt = await deployments.deploy('MasterChef', {
      from: owner.address,
      args: [
        BombToken.address,
        owner.address,
        owner.address,
        BombPerBlock,
        startBlock,
      ],
      log: true,
    })
    MasterChef = await ethers.getContractAt('MasterChef', receipt.address)
    // Deploy NFT
    receipt = await deployments.deploy('NFT', {
      from: owner.address,
      args: [
        usdc.address, "hiddenMetadataURI", oracle.address
      ],
      log: true,
    })
    NFTContract = await ethers.getContractAt('NFT', receipt.address)
  })
  describe('Deploy contract', async () => {
    it('should be deployed', async () => { })
    it('initialize contract', async () => {
      await usdc.initialize("usdc", "usdc", 18, ethers.utils.parseEther("10000"), true, owner.address);
      await usdc.mint(ethers.utils.parseEther("30000"))
      await usdc.transfer(alice.address,ethers.utils.parseEther("10000"))
      await usdc.transfer(bob.address,ethers.utils.parseEther("10000"))
      await BombToken.mint(owner.address, ethers.utils.parseEther("10000"))
      await GrenadeToken.mint(owner.address, ethers.utils.parseEther("10000"))
      await GrenadeToken.initialize(NFTContract.address, MasterChef.address);
    })
  })
  describe('NFT', async () => {
    it('initialize', async () => {
      await NFTContract.setSaleState(true);
     })
    it('Set NFT type', async function () {
      const totalSupply = await NFTContract.MAX_SUPPLY();
      console.log('totalSupply', totalSupply)
      for (let i = 0; i < 100; i++)
        await NFTContract.connect(oracle).setNFTType(i, Math.floor(Math.random() * 4) + 1 )
    })

    it('Mint NFT', async function () {

      await usdc.connect(alice).approve(NFTContract.address, ethers.utils.parseEther("5000"))
      await NFTContract.connect(alice).mintWithUSDC(100);

    })

    it('Mint Grenade Token', async function () {

      await GrenadeToken.connect(alice).mintforNFTholder(alice.address);
      await expect(GrenadeToken.connect(bob).mintforNFTholder(bob.address)).to.be.reverted;
      let GrenadeBal = await GrenadeToken.balanceOf(alice.address);
      console.log('Alice - GrenadeBal', GrenadeBal)
    })

    it('Expect Grenade transfer', async function () {

      await GrenadeToken.connect(alice).transfer(bob.address, ethers.utils.parseEther("1"));
      await expect(GrenadeToken.connect(alice).transfer(NFTContract.address, ethers.utils.parseEther("1"))).to.be.reverted;
      // await GrenadeToken.connect(alice).transfer(NFTContract.address, ethers.utils.parseEther("1"));
    })

    it('Withdraw USDC from NFT contract', async function () {

      const usdcBeforeBal = await usdc.balanceOf(owner.address);
      const contributedUSDC = await usdc.balanceOf(NFTContract.address);
      await NFTContract.withdrawERC20(usdc.address, owner.address, contributedUSDC);
      const usdcAfterBal = await usdc.balanceOf(owner.address);
      console.log('usdcBeforeBal', usdcBeforeBal)
      console.log('contributedUSDC', contributedUSDC)
      console.log('usdcAfterBal', usdcAfterBal)
    })
  })

  describe('Farm', async () => {
    it('Initialize', async function () {
      await BombToken.transferOwnership(MasterChef.address)
    })
    it('add LP to farm', async function () {
      await MasterChef.add(2000, GrenadeToken.address, 500, true);
      const poolInfo = await MasterChef.poolInfo(1);
      console.log('poolInfo', poolInfo)
      console.log('Grenade addr', GrenadeToken.address)
    })
    it('deposit/withdraw', async function () {
      // Farm Grenade

      let GrenadeBeforeBal = await GrenadeToken.balanceOf(alice.address);
      console.log('GrenadeBeforeBal', GrenadeBeforeBal)

      let BombBeforeBal = await BombToken.balanceOf(alice.address);
      console.log('BombBeforeBal', BombBeforeBal)

      await GrenadeToken.connect(alice).approve(MasterChef.address, GrenadeBeforeBal)
      await MasterChef.connect(alice).deposit(1, GrenadeBeforeBal)

      await mine(10000)

      let userInfo = await MasterChef.userInfo(1, alice.address)
      await MasterChef.connect(alice).withdraw(1, userInfo.amount)

      let GrenadeAfterBal = await GrenadeToken.balanceOf(alice.address);
      console.log('GrenadeAfter Bal', GrenadeAfterBal)

      let BombAfterBal = await BombToken.balanceOf(alice.address);
      console.log('BombAfte rBal', BombAfterBal)
    })

    it('emergency withdraw', async function () {

      let GrenadeBeforeBal = await GrenadeToken.balanceOf(alice.address);
      console.log('GrenadeBeforeBal', GrenadeBeforeBal)

      let BombBeforeBal = await BombToken.balanceOf(alice.address);
      console.log('BombBeforeBal', BombBeforeBal)

      await GrenadeToken.connect(alice).approve(MasterChef.address, GrenadeBeforeBal)
      await MasterChef.connect(alice).deposit(1, GrenadeBeforeBal)

      await mine(10000)

      let userInfo = await MasterChef.userInfo(1, alice.address)
      await MasterChef.connect(alice).emergencyWithdraw(1)
      
      let GrenadeAfterBal = await GrenadeToken.balanceOf(alice.address);
      console.log('GrenadeAft erBal', GrenadeAfterBal)

      let BombAfterBal = await BombToken.balanceOf(alice.address);
      console.log('BombAfter Bal', BombAfterBal)

    })
  })
})
