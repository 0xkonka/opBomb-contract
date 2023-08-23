import { ethers, network, run } from 'hardhat'
import {
  WETH_Deployed,
  feeManager,
} from './address'

// npx hardhat run scripts/deploy_2Dex.ts --network base-goerli

async function main(): Promise<void> {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1000))

  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')
  console.log('Account balance:', (await deployer.getBalance()).toString())

  // Deploy Factory
  const OpBombFactory = await ethers.getContractFactory('OpBombFactory')
  const OpBombFactory_Deployed = await OpBombFactory.deploy(feeManager)
  console.log('OpBombFactory_Deployed.address', OpBombFactory_Deployed.address)
  
  // Deploy Router
  const OpBombRouter = await ethers.getContractFactory('OpBombRouter')
  const OpBombRouter_Deployed = await OpBombRouter.deploy(
    OpBombFactory_Deployed.address,
    WETH_Deployed,
  )
  console.log('OpBombRouter_Deployed.address', OpBombRouter_Deployed.address)

  await sleep(10)

  await verify(OpBombFactory_Deployed.address, [feeManager])
  await verify(OpBombRouter_Deployed.address, [OpBombFactory_Deployed, WETH_Deployed])
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

// npx hardhat verify 0xCF1DABc38c78c83AEF79AC0546c947F29F1a1272 0x4Aa6Da4ca5d76e8d5e3ACD11B92Ab22D564F1fcb --network avaxfuji
