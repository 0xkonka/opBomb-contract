import { ethers } from 'hardhat'

async function main(): Promise<string> {
  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')

  console.log('Account balance:', (await deployer.getBalance()).toString())

  const InstaERC4626Resolver = await ethers.getContractFactory('InstaERC4626Resolver')
  const InstaERC4626Resolver_Deployed = await InstaERC4626Resolver.deploy(
    // params
  )

  return InstaERC4626Resolver_Deployed.address
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
