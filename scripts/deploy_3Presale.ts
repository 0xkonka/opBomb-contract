import { ethers, network, run } from 'hardhat'
import {
  BombToken_Deployed,
  OpBombRouter_Deployed,
  feeManager,
  OpBombPresale_Deployed,
} from './address'

// npx hardhat run scripts/deploy_3Presale.ts --network base-goerli
// npx hardhat run scripts/deploy_3Presale.ts --network avaxfuji

// npx hardhat run scripts/deploy_3Presale.ts --network base-mainnet

async function main(): Promise<void> {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1000))

  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')
  console.log('Account balance:', (await deployer.getBalance()).toString())

  // // Deploy Presale
  // const OpBombPresale = await ethers.getContractFactory('OpBombPresale')
  // const OpBombPresale_Deployed = await OpBombPresale.deploy()
  // console.log('OpBombPresale_Deployed.address', OpBombPresale_Deployed.address)

  // await sleep(20)
  // await verify(OpBombPresale_Deployed, [])

  const OpBombPresaleContract = await ethers.getContractAt(
    'OpBombPresale',
    OpBombPresale_Deployed,
  )

  let PresaleConfig = {
    token: BombToken_Deployed, // OpBomb token address
    price: ethers.utils.parseEther('333.333333'), //  0.015
    listing_price: ethers.utils.parseEther('266.666666'), // 0.01875
    liquidity_percent: 50, // 50%
    hardcap: ethers.utils.parseEther('30'), // 100 ETH
    softcap: ethers.utils.parseEther('20'), // 150 ETH
    min_contribution: ethers.utils.parseEther('0.1'), // 1 ETH
    max_contribution: ethers.utils.parseEther('0.6'), // 5 ETH
    white_startTime: 1692964980 - 3000,
    white_endTime: 1692964980 + 1.1 * 24 * 60 * 60, // ..
    startTime: 1692964980 - 3000, // ..
    endTime: 1692964980 + 3 * 24 * 60 * 60, // ..
    // liquidity_lockup_time: 3 * 24 * 60 * 60, // ex: 1 mont
  }

  const merkleRoot =
    '0x3219d89ff6af2065b729ca84cb2555b1be68dc5bff668e9236a2cd47b9d6fd30'
  const merkleProof = [
    '0x3d2714478942511cb61b6286f89c852553a45dccc39eb0f829677e525cb8bd6c',
    '0x8cf582160d25ea7bd25b0a438aa359cfcf796eb118ed763218f8bf041baf85d4',
    '0x257ee6ade342772c2f8c8aa966d80b2b7aa16fa8dee055fa7aa5ae0fe26691cf',
    '0x3f9ced07ab44017b8dd7b758999d4356f0088f31f23c98a47526ebb6726327c8',
    '0x082c9abcd399cf42d631505ebe163196e65a0da51ffe912eca980fb0a7dcd5d7',
    '0x2e0c1df71ede1905e51529e5dcb1dd59bf95a4beb7b6d822bf0ec1cd409265ec',
    '0x0515610a72fdb9cd90573bf4d4ae0a950021c5673d5ad53e9d75ec87cdf3c83d'
  ]

  try {
    await OpBombPresaleContract.initialize(PresaleConfig, OpBombRouter_Deployed)

    // await OpBombPresaleContract.closePresale()

    // await OpBombPresaleContract.addLiquidityOnOpBomb()

    // await OpBombPresaleContract.adminWithdraw("0x4200000000000000000000000000000000000006", "0x30B9b98fB0a812568Df9Dc1C025324efacBc7e00", ethers.utils.parseEther("10"));

    // await OpBombPresaleContract.setMerkleRoot(merkleRoot)


  } catch (err) {
    console.log('err', err)
  }
}

const verify = async (contractAddress: string, args: any[]) => {
  console.log('Verifying contract...')
  try {
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
    })
  } catch (e: any) {
    if (e.message.toLowerCase().includes('already verified')) {
      console.log('Already verified!')
    } else {
      console.log(e)
    }
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
