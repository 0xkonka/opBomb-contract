import { ethers, network, run } from 'hardhat'
import {
  BombToken_Deployed,
  MasterChef_Deployed
} from './address'


// npx hardhat run scripts/deploy_1Bomb.ts --network base-goerli
// npx hardhat run scripts/deploy_1Bomb.ts --network base-mainnet


async function main(): Promise<void> {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1000))

  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')
  console.log('Account balance:', (await deployer.getBalance()).toString())

  // Deploy Bomb Token
  // const BombToken = await ethers.getContractFactory('BombToken')
  // const BombToken_Deployed = await BombToken.deploy()
  // console.log('BombToken_Deployed.address', BombToken_Deployed.address)

  // // Deploy SyrupBar
  // const SyrupBar = await ethers.getContractFactory('SyrupBar')
  // const SyrupBar_Deployed = await SyrupBar.deploy(BombToken_Deployed.address)
  // console.log('SyrupBar_Deployed.address', SyrupBar_Deployed.address)

  // await sleep(10)
  // await verify(BombToken_Deployed.address, [])
  // await verify(SyrupBar_Deployed.address, [BombToken_Deployed.address])

  await sleep(10)
  const BombTokenContract = await ethers.getContractAt(
    'BombToken',
    BombToken_Deployed,
  )

  try {
    // await BombTokenContract.mint("0x30B9b98fB0a812568Df9Dc1C025324efacBc7e00", ethers.utils.parseEther("16000"))
    // await BombTokenContract.transfer("0xdF2f7fDdA5b3AcB4F7B841A7C0D497D09dE1Ea11", ethers.utils.parseEther("16000"))
    
    await BombTokenContract.transferOwnership(MasterChef_Deployed)

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

