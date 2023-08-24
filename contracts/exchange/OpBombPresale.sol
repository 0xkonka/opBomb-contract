// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./interfaces/IOpBombRouter02.sol";
import "./interfaces/IOpBombFactory.sol";

library MerkleProof {
    function verify(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        return processProof(proof, leaf) == root;
    }

    function processProof(
        bytes32[] memory proof,
        bytes32 leaf
    ) internal pure returns (bytes32) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = _efficientHash(computedHash, proofElement);
            } else {
                computedHash = _efficientHash(proofElement, computedHash);
            }
        }
        return computedHash;
    }

    function _efficientHash(
        bytes32 a,
        bytes32 b
    ) private pure returns (bytes32 value) {
        assembly {
            mstore(0x00, a)
            mstore(0x20, b)
            value := keccak256(0x00, 0x40)
        }
    }
}

contract OpBombPresale is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    bool initialized = false;

    IERC20 public presaleToken;
    address public wETH;
    address public pair;

    IOpBombFactory private OpBombFactory;
    IOpBombRouter02 public OpBombRouter;

    address private constant deadAddr =
        0x000000000000000000000000000000000000dEaD;

    struct PresaleConfig {
        address token; // OpBomb token address
        uint256 price; //  0.015
        uint256 listing_price; // 0.01875
        uint256 liquidity_percent; // 50%
        uint256 hardcap; // 100 ETH
        uint256 softcap; // 150 ETH
        uint256 min_contribution; // 1 ETH
        uint256 max_contribution; // 5 ETH
        uint256 white_startTime; // ..
        uint256 white_endTime; // ..
        uint256 startTime; // ..
        uint256 endTime; // ..
    }
    enum PresaleStatus {
        Started,
        Finished,
        LiquidityAdded
    }
    enum FunderStatus {
        None,
        Invested,
        Claimed
    }
    struct Funder {
        uint256 amount;
        uint256 claimed_amount;
        FunderStatus status;
    }

    PresaleConfig public presaleConfig;
    PresaleStatus public status;

    mapping(address => Funder) public funders;
    uint256 public funderCounter;

    uint256 private totalPaid;
    uint256 public totalSold;
    uint256 public tokenReminder;

    address public treasury = 0xdF2f7fDdA5b3AcB4F7B841A7C0D497D09dE1Ea11;

    bytes32 private merkleRoot;

    event Contribute(address funder, uint256 amount);
    event Claimed(address funder, uint256 amount);
    
    event PresaleClosed();
    event LiquidityAdded(address token, uint256 amount);

    constructor() {}

    function initialize(
        PresaleConfig memory _config,
        address _OpBombRouter
    ) external {
        require(!initialized, "already initialized");
        require(
            owner() == address(0x0) || _msgSender() == owner(),
            "not allowed"
        );

        initialized = true;

        presaleToken = IERC20(_config.token);
        presaleConfig = _config;

        OpBombRouter = IOpBombRouter02(_OpBombRouter);
        address OpBombFactoryAddress = OpBombRouter.factory();
        OpBombFactory = IOpBombFactory(OpBombFactoryAddress);

        wETH = OpBombRouter.WETH();
        pair = OpBombFactory.getPair(address(presaleToken), wETH);
        if (pair == address(0x0)) {
            pair = OpBombFactory.createPair(address(presaleToken), wETH);
        }
    }

    // User functions
    function contribute(
        bytes32[] calldata merkleProof
    ) external payable nonReentrant {
        require(
            msg.value >= presaleConfig.min_contribution,
            "TokenSale: Contribution amount is too low!"
        );
        require(
            msg.value <= presaleConfig.max_contribution,
            "TokenSale: Contribution amount is too high!"
        );
        require(
            address(this).balance <= presaleConfig.hardcap,
            "TokenSale: Hard cap was reached!"
        );

        require(status == PresaleStatus.Started, "TokenSale: Presale is over!");

        bool isWhitelister = whiteLister(merkleProof);

        if (isWhitelister) {
            require(
                block.timestamp > presaleConfig.white_startTime,
                "TokenSale: White Presale is not started yet!"
            );
            require(
                block.timestamp < presaleConfig.white_endTime,
                "TokenSale: White Presale is over!"
            );
        } else {
            require(
                block.timestamp > presaleConfig.startTime,
                "TokenSale: Presale is not started yet!"
            );

            require(
                block.timestamp < presaleConfig.endTime,
                "TokenSale: Presale is over!"
            );
        }

        Funder storage funder = funders[_msgSender()];
        require(
            funder.amount + msg.value <= presaleConfig.max_contribution,
            "TokenSale: Contribution amount is too high, you was reached contribution maximum!"
        );
        if (funder.amount == 0 && funder.status == FunderStatus.None) {
            funderCounter++;
        }

        funder.amount = funder.amount + msg.value;
        funder.status = FunderStatus.Invested;
        totalSold += (msg.value * presaleConfig.price) / 10 ** 18;

        emit Contribute(_msgSender(), msg.value);
    }

    function claim(bytes32[] calldata merkleProof) external nonReentrant {
        require(
            status == PresaleStatus.LiquidityAdded,
            "TokenSale: Presale is not finished"
        );

        Funder storage funder = funders[_msgSender()];

        require(
            funder.amount > 0 && funder.status == FunderStatus.Invested,
            "TokenSale: You are not a funder!"
        );

        bool isWhitelister = whiteLister(merkleProof);
        uint256 amount;
        if (isWhitelister)
            amount = (funder.amount * presaleConfig.price) / 10 ** 18;
        else
            amount =
                ((funder.amount * presaleConfig.price) * 105) /
                100 /
                10 ** 18;

        funder.claimed_amount = amount;
        funder.status = FunderStatus.Claimed;
        _safeTransfer(presaleToken, _msgSender(), amount);
        emit Claimed(_msgSender(), amount);
    }

    function closePresale() external nonReentrant onlyOwner {
        require(status == PresaleStatus.Started, "TokenSale: Already closed");
        _setPresaleStatus(PresaleStatus.Finished);

        totalPaid = address(this).balance;

        emit PresaleClosed();
    }

    function totalRaised() external view returns (uint256) {
        if (totalPaid > 0) return totalPaid;
        return address(this).balance;
    }

    function setPresaleLiquidityAdded() external nonReentrant onlyOwner {
        _setPresaleStatus(PresaleStatus.LiquidityAdded);
    }

    function addLiquidityOnOpBomb()
        external
        nonReentrant
        onlyOwner
        returns (uint256 amountA, uint256 amountB, uint256 liquidity)
    {
        require(
            status == PresaleStatus.Finished,
            "TokenSale: Presale not finished"
        );

        uint256 amountTokenDesired = (totalPaid *
            presaleConfig.listing_price *
            presaleConfig.liquidity_percent) /
            100 /
            10 ** 18;
        presaleToken.approve(address(OpBombRouter), amountTokenDesired);

        unchecked {
            tokenReminder =
                presaleToken.balanceOf(address(this)) -
                amountTokenDesired -
                totalSold;
            require(tokenReminder >= 0, "Token Reminder Exceeds");
        }

        uint256 amountETH = (totalPaid * presaleConfig.liquidity_percent) / 100;
        (amountA, amountB, liquidity) = OpBombRouter.addLiquidityETH{
            value: amountETH
        }(
            address(presaleToken),
            amountTokenDesired,
            0,
            0,
            address(this),
            type(uint256).max
        );

        emit LiquidityAdded(pair, liquidity);
        _setPresaleStatus(PresaleStatus.LiquidityAdded);

        _burnLPTokens();
    }

    // Merkle mechanism

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function whiteLister(
        bytes32[] calldata merkleProof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(
            bytes.concat(keccak256(abi.encode(msg.sender)))
        );

        bool whitelisted = MerkleProof.verify(merkleProof, merkleRoot, leaf);
        return whitelisted;
    }

    function viewClaimableAmount(
        bytes32[] calldata merkleProof
    ) public view returns (uint256) {
        Funder memory funder = funders[_msgSender()];
        bool isWhitelister = whiteLister(merkleProof);
        uint256 amount;
        if (isWhitelister)
            amount = (funder.amount * presaleConfig.price) / 10 ** 18;
        else
            amount =
                ((funder.amount * presaleConfig.price) * 105) /
                100 /
                10 ** 18;
        return amount;
    }

    // Internal functions
    function _burnLPTokens() internal {
        IERC20 LPToken = IERC20(pair);
        uint256 amount = LPToken.balanceOf(address(this));
        _safeTransfer(LPToken, deadAddr, amount);
    }

    function _setPresaleStatus(PresaleStatus _status) internal {
        status = _status;
    }

    function _safeTransferETH(address _to, uint256 _value) internal {
        (bool success, ) = _to.call{ value: _value }(new bytes(0));
        require(success, "TransferHelper: ETH_TRANSFER_FAILED");
    }

    function _safeTransfer(
        IERC20 _token,
        address _to,
        uint256 _amount
    ) internal {
        _token.safeTransfer(_to, _amount);
    }

    receive() external payable {
        _safeTransferETH(treasury, msg.value);
    }

    function adminWithdraw(
        IERC20 _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        _token.safeTransfer(_to, _amount);
    }
}
