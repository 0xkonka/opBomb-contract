import { ethers, network, run } from 'hardhat'
import {
  BombToken_Deployed,
  OpBombRouter_Deployed,
  feeManager,
  OpBombPresale_Deployed
} from './address'

// npx hardhat run scripts/deploy_3Presale.ts --network base-goerli

async function main(): Promise<void> {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1000))

  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')
  console.log('Account balance:', (await deployer.getBalance()).toString())

  // Deploy Presale
  const OpBombPresale = await ethers.getContractFactory('OpBombPresale')
  const OpBombPresale_Deployed = await OpBombPresale.deploy()
  console.log('OpBombPresale_Deployed.address', OpBombPresale_Deployed.address)

  await sleep(20)
  await verify(OpBombPresale_Deployed.address, [])

  // const OpBombPresaleContract = await ethers.getContractAt(
  //   'OpBombPresale',
  //   OpBombPresale_Deployed,
  // )

  // let PresaleConfig = {
  //   token: BombToken_Deployed, // OpBomb token address
  //   price: ethers.utils.parseEther('333.333333'), //  0.015
  //   listing_price: ethers.utils.parseEther('266.666666'), // 0.01875
  //   liquidity_percent: 50, // 50%
  //   hardcap: ethers.utils.parseEther('2'), // 100 ETH
  //   softcap: ethers.utils.parseEther('1'), // 150 ETH
  //   min_contribution: ethers.utils.parseEther('0.1'), // 1 ETH
  //   max_contribution: ethers.utils.parseEther('0.6'), // 5 ETH
  //   startTime: 0, // ..
  //   endTime: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60, // ..
  //   // liquidity_lockup_time: 3 * 24 * 60 * 60, // ex: 1 mont
  // }

  // try {
  //   // await OpBombPresaleContract.initialize(PresaleConfig, OpBombRouter_Deployed)

  //   await OpBombPresaleContract.setMerkleRoot(
  //     '0x876af87d2c2270871c553651eb0105b1c644c49943522d9e5d0cb2d95fc8386c',
  //   )

  //   // await OpBombPresaleContract.contribute({
  //   //   value: ethers.utils.parseEther('0.1'),
  //   // })
  // } catch (err) {
  //   console.log('err', err)
  // }
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
