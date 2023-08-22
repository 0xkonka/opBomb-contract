import { ethers } from 'hardhat'
import { feeManager } from './address'

async function main(): Promise<string> {
  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')

  console.log('Account balance:', (await deployer.getBalance()).toString())

  // const OpBombFactory = await ethers.getContractFactory('OpBombFactory')
  // const OpBombFactory_Deployed = await OpBombFactory.deploy(
  //   feeManager
  // )

  // console.log('OpBombFactory_Deployed.address', OpBombFactory_Deployed.address)

  // const WETH = await ethers.getContractFactory('WETH')
  // const WETH_Deployed = await WETH.deploy()

  // console.log('WETH_Deployed.address', WETH_Deployed.address)

  const OpBombRouter = await ethers.getContractFactory('OpBombRouter')
  const OpBombRouter_Deployed = await OpBombRouter.deploy(
    // OpBombFactory_Deployed.address,
    // WETH_Deployed.address
    "0xBDEF5Dc435E24690651f708FB2250F05A17Fe5c1",
    "0x4D7019A27fc40ba452cd53B5c9Ed455aDF0ff68A"
  )
  console.log('OpBombRouter_Deployed.address', OpBombRouter_Deployed.address)

  return OpBombRouter_Deployed.address
}

main()
  .then((r: string) => {
    console.log('deployed address:', r)
    return r
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
