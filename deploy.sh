# Deploy step

# npx hardhat run --network avaxmainnet scripts/deployMulticall.ts
# npx hardhat verify --network avaxmainnet

# npx hardhat run --network avaxmainnet scripts/deployVintageWine.ts
# npx hardhat verify --network avaxmainnet

# npx hardhat run --network avaxmainnet scripts/deployRoyalty.ts
# npx hardhat verify --network avaxmainnet (--constructor_args: WAVAXAddress)

# npx hardhat run --network avaxmainnet scripts/deployVintner.ts
# npx hardhat verify --network avaxmainnet (--constructor_args: grapeAddress coupenPublic, oracleAddress, BASE_URI)

# npx hardhat run --network avaxmainnet scripts/deployUpgrade.ts
# npx hardhat verify --network avaxmainnet (--constructor_args: vintageWindAddress, grapeTokenAddress, BASE_URI_UPGRADE)

# npx hardhat run --network avaxmainnet scripts/deployCellar.ts
# npx hardhat verify --network avaxmainnet (--constructor_args: vintageWindAddress)

# npx hardhat run --network avaxmainnet scripts/deployWineryProgression.ts
# npx hardhat verify --network avaxmainnet (--constructor_args: grapeTokenAddress)

# npx hardhat run --network avaxmainnet scripts/deployWinery.ts
# Go to scan and get proxy contract address
# npx hardhat verify --network avaxmainnet (--address: proxy address)

# Update winery contract
# npx hardhat run --network avaxmainnet scripts/upgradeWinery.ts

# npx hardhat run --network avaxmainnet scripts/deployVintageWineFountain.ts
# npx hardhat verify --network avaxmainnet 


# // Deploy ALl
# npx hardhat run --network avaxmainnet scripts/deployAll.ts

echo "DEPLOY"
echo ""
rm -rf cache && rm -rf artifacts
CMD="npx hardhat run --network avaxmainnet scripts/deployVintageWine.ts"
echo "CMD: $CMD"
output=`eval $CMD`
echo "output: $output"

echo ""
echo "VERIFY"
echo ""
CMD2="npx hardhat verify --network avaxmainnet $output"
echo "CMD2: $CMD2"
output2=`eval $CMD2`
echo "output2: $output2"
