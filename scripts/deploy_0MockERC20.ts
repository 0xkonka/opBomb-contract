import { ethers, network, run } from 'hardhat'

// npx hardhat run scripts/deploy_0MockERC20.ts --network base-goerli

async function main(): Promise<void> {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1000))

  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')
  console.log('Account balance:', (await deployer.getBalance()).toString())
  
  const MockERC201 = await ethers.getContractFactory('MockERC20')
  const MockERC201_Deployed = await MockERC201.deploy("Mock1","Mock1", ethers.utils.parseEther("10000"))
  console.log('MockERC203_Deployed.address', MockERC201_Deployed.address)

  const MockERC202 = await ethers.getContractFactory('MockERC20')
  const MockERC202_Deployed = await MockERC202.deploy("Mock2","Mock2", ethers.utils.parseEther("10000"))
  console.log('MockERC203_Deployed.address', MockERC202_Deployed.address)

  const MockERC203 = await ethers.getContractFactory('MockERC20')
  const MockERC203_Deployed = await MockERC203.deploy("Mock3","Mock3", ethers.utils.parseEther("10000"))
  console.log('MockERC203_Deployed.address', MockERC203_Deployed.address)

  // Deploy WETH
  const WETH = await ethers.getContractFactory('WETH')
  const WETH_Deployed = await WETH.deploy()
  console.log('WETH_Deployed.address', WETH_Deployed.address)

  await sleep(10)

  await verify(MockERC201_Deployed.address, ["Mock1","Mock1", ethers.utils.parseEther("10000")])
  await verify(MockERC202_Deployed.address, ["Mock2","Mock2", ethers.utils.parseEther("10000")])
  await verify(MockERC203_Deployed.address, ["Mock3","Mock3", ethers.utils.parseEther("10000")])
  await verify(WETH_Deployed.address, [])
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

