import { ethers, network, run } from 'hardhat'
import { feeManager } from './address'

async function main(): Promise<void> {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1000))

  const factory = '0xadc4cEdd19e916289828F6A9c1d2d77E71Fa8c6F'
  const weth = '0x1DF776F2025B73db8A6A32E142886e2E0055d0E2'
  const OpBombRouter = '0x031b6014C0ea414A9f60604Fa0AbBd97BC16dF4e'
  const presale = '0x5Afc8C54F1BaA8DcB824978c62D74C697a533683'
  const BombToken_Deployed = "0x3B81fd824EE3F948d55785a5E54693B6705e70a0"

  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')
  console.log('Account balance:', (await deployer.getBalance()).toString())

  // Deploy Bomb Token
  // const BombToken = await ethers.getContractFactory('BombToken')
  // const BombToken_Deployed = await BombToken.deploy()
  // console.log('BombToken_Deployed.address', BombToken_Deployed.address)

  // Deploy Presale
  // const OpBombPresale = await ethers.getContractFactory('OpBombPresale')
  // const OpBombPresale_Deployed = await OpBombPresale.deploy()
  // console.log('OpBombPresale_Deployed.address', OpBombPresale_Deployed.address)

  // await sleep(10)
  // await verify(BombToken_Deployed.address, [])
  // await verify(OpBombPresale_Deployed.address, [])
  
  const OpBombPresale = await ethers.getContractAt(
    'OpBombPresale',
    '0x5Afc8C54F1BaA8DcB824978c62D74C697a533683',
  )

  let PresaleConfig = {
    token: BombToken_Deployed, // OpBomb token address
    price: ethers.utils.parseEther('333.33'), //  0.015
    listing_price: ethers.utils.parseEther('266.66'), // 0.01875
    liquidity_percent: 50, // 50%
    hardcap: ethers.utils.parseEther('2'), // 100 ETH
    softcap: ethers.utils.parseEther('1'), // 150 ETH
    min_contribution: ethers.utils.parseEther('0.1'), // 1 ETH
    max_contribution: ethers.utils.parseEther('1'), // 5 ETH
    startTime: Math.floor(Date.now() / 1000), // ..
    endTime: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60, // ..
    liquidity_lockup_time: 3 * 24 * 60 * 60, // ex: 1 mont
  }

  await OpBombPresale.initialize(
    PresaleConfig,
    OpBombRouter,
    feeManager,
    feeManager,
    500,
    0,
    0,
  )
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

// Bomb Token 0x3B81fd824EE3F948d55785a5E54693B6705e70a0

// npx hardhat run scripts/deployPresale.ts --network avaxfuji

// npx hardhat verify 0xCF1DABc38c78c83AEF79AC0546c947F29F1a1272 0x4Aa6Da4ca5d76e8d5e3ACD11B92Ab22D564F1fcb --network avaxfuji
