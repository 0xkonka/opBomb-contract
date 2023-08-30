import { ethers, network, run } from 'hardhat'
import {
  BombToken_Deployed,
  // SyrupBar_Deployed,
  feeManager,
  MasterChef_Deployed,
} from './address'

// npx hardhat run scripts/deploy_4Masterchef.ts --network base-mainnet

async function main(): Promise<void> {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1000))

  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')
  console.log('Account balance:', (await deployer.getBalance()).toString())

  const BombPerBlock = ethers.utils.parseEther('0.03')
  const startBlock = 3101029

  const MasterChef = await ethers.getContractFactory('MasterChef')
  const MasterChef_Deployed = await MasterChef.deploy(
    BombToken_Deployed,
    feeManager,
    feeManager,
    BombPerBlock,
    startBlock,
  )
  console.log('MasterChef.address', MasterChef_Deployed.address)

  // await sleep(10)

  await verify(MasterChef_Deployed.address, [
    BombToken_Deployed,
    feeManager,
    feeManager,
    BombPerBlock,
    startBlock,
  ])

  // const MasterChef = await ethers.getContractAt(
  //   'MasterChef',
  //   MasterChef_Deployed,
  // )
  // try {
  //   await MasterChef.enterStaking(ethers.utils.parseEther('100'))
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

// npx hardhat run scripts/deployFarm.ts --network avaxfuji

// npx hardhat verify 0xCF1DABc38c78c83AEF79AC0546c947F29F1a1272 0x4Aa6Da4ca5d76e8d5e3ACD11B92Ab22D564F1fcb --network avaxfuji
// npx hardhat verify 0x219Ac131A00a7C5D8ee19D178B81a63575e3E23c --network avaxfuji
// npx hardhat verify 0x031b6014C0ea414A9f60604Fa0AbBd97BC16dF4e 0xadc4cEdd19e916289828F6A9c1d2d77E71Fa8c6F 0x1DF776F2025B73db8A6A32E142886e2E0055d0E2 --network avaxfuji
