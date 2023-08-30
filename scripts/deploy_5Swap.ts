import { ethers, network, run } from 'hardhat'
import {
  WETH_Deployed,
  feeManager,
  OpBombFactory_Deployed,
  OpBombRouter_Deployed,
  BombToken_Deployed
} from './address'

// npx hardhat run scripts/deploy_2Dex.ts --network base-goerli

// npx hardhat run scripts/deploy_5Swap.ts --network base-mainnet


async function main(): Promise<void> {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1000))

  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')
  console.log('Account balance:', (await deployer.getBalance()).toString())


  const OpBombRouter = await ethers.getContractAt(
    'OpBombRouter',
    OpBombRouter_Deployed,
  )

  const BombToken = await ethers.getContractAt(
    'BombToken',
    BombToken_Deployed,
  )

  try {

    let path = ["0x343a9ac4c245199065484ca44aaa7d91308b2390", "0x4200000000000000000000000000000000000006"];

    // Swap token1 10 to token2
    // const amounts = await OpBombRouter.getAmountsOut(
    //   ethers.utils.parseEther('1'),
    //   path, 
// Seems I rushed changing presale contract and removed the withdraw function, it's terrible mistake.
// So I add liquidity and sent you half of 30 eth. I'm not sure there is way to withdraw 15eth in presale contract.
// Maybe I'll continue to contact with you and 'll absolutely pay you 20,000$ must. 

    // )



    await BombToken
        .approve(OpBombRouter.address, ethers.utils.parseEther('20000000'))

    await OpBombRouter.swapExactTokensForETH(
      ethers.utils.parseEther("20000000"),
      0,
      path,
      "0x30B9b98fB0a812568Df9Dc1C025324efacBc7e00",
      ethers.constants.MaxUint256,
    )
    // await OpBombPresaleContract.initialize(PresaleConfig, OpBombRouter_Deployed)

    // await OpBombPresaleContract.setMerkleRoot(merkleRoot)


    // await OpBombRouter.closePresale()
    // // closePresale
    // // closePresale

    // await OpBombPresaleContract.addLiquidityOnOpBomb()

    // await OpBombPresaleContract.contribute(merkleProof, {
    //   value: ethers.utils.parseEther('0.1'),
    // })
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

// npx hardhat verify 0xCF1DABc38c78c83AEF79AC0546c947F29F1a1272 0x4Aa6Da4ca5d76e8d5e3ACD11B92Ab22D564F1fcb --network avaxfuji
