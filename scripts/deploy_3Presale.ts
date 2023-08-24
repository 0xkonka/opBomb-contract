import { ethers, network, run } from 'hardhat'
import {
  BombToken_Deployed,
  OpBombRouter_Deployed,
  feeManager,
  OpBombPresale_Deployed,
} from './address'

// npx hardhat run scripts/deploy_3Presale.ts --network base-goerli
// npx hardhat run scripts/deploy_3Presale.ts --network avaxfuji

async function main(): Promise<void> {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1000))

  const [deployer] = await ethers.getSigners()
  if (deployer === undefined) throw new Error('Deployer is undefined.')
  console.log('Account balance:', (await deployer.getBalance()).toString())

  // // Deploy Presale
  // const OpBombPresale = await ethers.getContractFactory('OpBombPresale')
  // const OpBombPresale_Deployed = await OpBombPresale.deploy()
  // console.log('OpBombPresale_Deployed.address', OpBombPresale_Deployed.address)

  // await sleep(20)
  // await verify("0x909E5508a8c8F679F97BCf0a48B4DC2C6FEDFAa4", [])

  const OpBombPresaleContract = await ethers.getContractAt(
    'OpBombPresale',
    OpBombPresale_Deployed,
  )

  let PresaleConfig = {
    token: BombToken_Deployed, // OpBomb token address
    price: ethers.utils.parseEther('333.333333'), //  0.015
    listing_price: ethers.utils.parseEther('266.666666'), // 0.01875
    liquidity_percent: 50, // 50%
    hardcap: ethers.utils.parseEther('2'), // 100 ETH
    softcap: ethers.utils.parseEther('1'), // 150 ETH
    min_contribution: ethers.utils.parseEther('0.1'), // 1 ETH
    max_contribution: ethers.utils.parseEther('0.6'), // 5 ETH
    white_startTime: 0,
    white_endTime: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60, // ..
    startTime: 0, // ..
    endTime: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60, // ..
    // liquidity_lockup_time: 3 * 24 * 60 * 60, // ex: 1 mont
  }

  const merkleRoot =
    '0x981efbef227776be75419b50cb6b9390419f792c9cc6621062535d8e118f0aca'
  const merkleProof = [
    '0xd941ab7ee7e892ce524a156fcd7589ef13d6905a9b62d033810d6357e583f5fc',
    '0x5c945087e19664fcfd41fcc1ac0774dbbe5e74667bae8190b92b57829e1abd5f',
    '0xc1b3df38ca46ccc2936865597c18e70484a098c47120779ca543c9a9b69ef67c',
    '0x43767b94aebdb609b9ba0c4dc2aa7a46c150ccfe125b7d39ff0c292442517e4f',
    '0xbb0f0e3d3411f7bea0a4feea98031c4d2086bfe205ba7610650f356173438dfd',
    '0x147446422117e2d7fcdb8f2e20c5d6fe55fc4486bc481a24749c5374a2e8572e',
    '0x899fcc83e4d8c964735cb0ba346c34aae755312beb2c478d2d7f0f692ea2c6ee',
  ]

  try {
    // await OpBombPresaleContract.initialize(PresaleConfig, OpBombRouter_Deployed)

    // await OpBombPresaleContract.setMerkleRoot(merkleRoot)

    await OpBombPresaleContract.contribute(merkleProof, {
      value: ethers.utils.parseEther('0.1'),
    })
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
