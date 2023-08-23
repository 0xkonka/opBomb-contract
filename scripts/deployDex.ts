import { ethers, network, run } from 'hardhat'
import { feeManager } from './address'

async function main(): Promise<void> {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1000))

  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')
  console.log('Account balance:', (await deployer.getBalance()).toString())

  // // Deploy Factory
  // const OpBombFactory = await ethers.getContractFactory('OpBombFactory')
  // const OpBombFactory_Deployed = await OpBombFactory.deploy(feeManager)
  // console.log('OpBombFactory_Deployed.address', OpBombFactory_Deployed.address)
  // // Deploy WETH
  // const WETH = await ethers.getContractFactory('WETH')
  // const WETH_Deployed = await WETH.deploy()
  // console.log('WETH_Deployed.address', WETH_Deployed.address)

  // // Deploy Router
  // const OpBombRouter = await ethers.getContractFactory('OpBombRouter')
  // const OpBombRouter_Deployed = await OpBombRouter.deploy(
  //   OpBombFactory_Deployed.address,
  //   WETH_Deployed.address,
  // )
  // console.log('OpBombRouter_Deployed.address', OpBombRouter_Deployed.address)

  // Deploy Presale
  const OpBombPresale = await ethers.getContractFactory('OpBombPresale')
  const OpBombPresale_Deployed = await OpBombPresale.deploy()
  console.log('OpBombPresale_Deployed.address', OpBombPresale_Deployed.address)
  await sleep(10)

  // await verify(OpBombFactory_Deployed.address, [feeManager])
  // await verify(WETH_Deployed.address, [])
  // await verify(OpBombRouter_Deployed.address, [
  //   OpBombFactory_Deployed.address,
  //   WETH_Deployed.address,
  // ])
  await verify(OpBombPresale_Deployed.address, [])

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

// factory: 0xadc4cEdd19e916289828F6A9c1d2d77E71Fa8c6F
// weth: 0x1DF776F2025B73db8A6A32E142886e2E0055d0E2
// router: 0x031b6014C0ea414A9f60604Fa0AbBd97BC16dF4e
// presale: 0x5Afc8C54F1BaA8DcB824978c62D74C697a533683

// npx hardhat run scripts/deployDex.ts --network avaxfuji

// npx hardhat verify 0xCF1DABc38c78c83AEF79AC0546c947F29F1a1272 0x4Aa6Da4ca5d76e8d5e3ACD11B92Ab22D564F1fcb --network avaxfuji
// npx hardhat verify 0x219Ac131A00a7C5D8ee19D178B81a63575e3E23c --network avaxfuji
// npx hardhat verify 0x031b6014C0ea414A9f60604Fa0AbBd97BC16dF4e 0xadc4cEdd19e916289828F6A9c1d2d77E71Fa8c6F 0x1DF776F2025B73db8A6A32E142886e2E0055d0E2 --network avaxfuji
