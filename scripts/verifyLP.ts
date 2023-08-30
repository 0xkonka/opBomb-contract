import { ethers, network, run } from 'hardhat'
import { feeManager } from './address'

// npx hardhat run scripts/verifyLP.ts --network  base-mainnet

async function main(): Promise<void> {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1000))

  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')
  console.log('Account balance:', (await deployer.getBalance()).toString())

  const LPAddr = [
    '0x30af82919384c97e5c350373d0bcbb2d1129eade',
    
  ]

  for (let i = 0; i < LPAddr.length; i++) {
    // const LPContract = await ethers.getContractAt(
    //   'OpBombPair',
    //   LPAddr[i],
    // )

    await verify(LPAddr[i], [])
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
