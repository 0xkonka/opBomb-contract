import { ethers, network, run } from 'hardhat'
import { feeManager } from './address'

// npx hardhat run scripts/verifyLP.ts --network base-goerli

async function main(): Promise<void> {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1000))

  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')
  console.log('Account balance:', (await deployer.getBalance()).toString())

  const LPAddr = [
    '0x4D7019A27fc40ba452cd53B5c9Ed455aDF0ff68A',
    '0x8224414795Afa40a7f65D541a7e802f2A2bc1e89',
    '0x97C1bca8CD94A92908a3ED061b046a1b0e1Ae367',
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
