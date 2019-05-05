pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./IERC1948.sol";
import "./PlasmaBridge.sol";
import "./Arbitrator.sol";
import "./IArbitrable.sol";

/** @title ArbitratorTxCondition
 *  Allows arbitrable transactions to take place on plasma leap.
 *  The sender is given a challenge period during which he can lock the funds on the spending condition.
 *  Once the tokens are locked, they can be exited to the root chain to go through a dispute resolution system.
 */
contract ArbitrableTxCondition is IArbitrable{
    address constant public TOKEN_ADDR = 0x1111111111111111111111111111111111111111;
    address constant public SENDER = 0x2222222222222222222222222222222222222222;
    address constant public RECEIVER = 0x3333333333333333333333333333333333333333;
    address constant public CHALLENGE_NST = 0x4444444444444444444444444444444444444444;
    uint constant public CHALLENGE_NST_ID = 123456789;

    string constant public RULING_OPTIONS = "Reimburse partyA;Pay partyB";
    uint8 constant public AMOUNT_OF_CHOICES = 2; // The number of ruling options available.
    address constant public ARBITRATOR = 0x5555555555555555555555555555555555555555;
    bytes constant public ARBITRATOR_EXTRA_DATA = "";
    string constant public META_EVIDENCE = "/ipfs/QmbwHnW...";

    uint constant CHALLENGE_PERIOD_END = 99999;

    address constant public PLASMA_BRIDGE = 0x6666666666666666666666666666666666666666;

    enum RulingOptions {NoRuling, SenderWins, ReceiverWins}

    modifier onlyArbitrator {
        require(
            msg.sender == address(ARBITRATOR),
            "Can only be called by the arbitrator."
        );
        _;
    }

    /** @dev Either transfers the tokens to the recipient after the challenge period, or locks them for dispute resolution.
     *  @param _r The r parameter of the sender signature.
     *  @param _s The s parameter of the sender signature.
     *  @param _v The verification parameter of the sender signature.
     */
    function fulfill (bytes32 _r, bytes32 _s, uint8 _v) external {
        IERC1948 nst = IERC1948(CHALLENGE_NST);
        IERC20 token = IERC20(TOKEN_ADDR);
        uint challenged = uint(nst.readData(CHALLENGE_NST_ID));

        if (now <= CHALLENGE_PERIOD_END ) {
            address signer = ecrecover(bytes32(bytes20(address(this))), _v, _r, _s);
            require(signer == SENDER, "Only the sender can challenge the transfer.");
            nst.writeData(CHALLENGE_NST_ID, bytes32(uint(1)));
        } else if (challenged == 0) {
            token.transfer(RECEIVER, token.balanceOf(address(this)));
        }
    }

///////////////////
// Root Chain
///////////////////

    /** @dev Exit spending condition to root chain.
     *  @param _proof Merkle proof of inclusion.
     *  @param _oindex Output index of the UTXO.
     */
    function startExit(bytes32[] memory _proof, uint _oindex) public {
        require(msg.sender == SENDER || msg.sender == RECEIVER);
        PlasmaBridge bridge = PlasmaBridge(PLASMA_BRIDGE);
        bridge.startExit(_proof, _oindex);
    }

    /** @dev Raise dispute.
     */
    function raiseDispute() public payable {
        Arbitrator arbitrator = Arbitrator(ARBITRATOR);
        uint arbitrationCost = arbitrator.arbitrationCost(ARBITRATOR_EXTRA_DATA);
        require(msg.value >= arbitrationCost, "Not enough ETH to fund dispute");

        uint disputeID = arbitrator.createDispute.value(msg.value)(AMOUNT_OF_CHOICES, ARBITRATOR_EXTRA_DATA);
        emit MetaEvidence(0, META_EVIDENCE);
        emit Dispute(arbitrator, disputeID, 0, 0);
    }

    /** @dev Submit a reference to evidence. EVENT.
     *  @param _evidence A link to an evidence using its URI.
     */
    function submitEvidence(string memory _evidence) public {
        emit Evidence(Arbitrator(ARBITRATOR), 0, msg.sender, _evidence);
    }

    /** @dev Appeal an appealable ruling.
     *  Note that no checks are required as the checks are done by the arbitrator.
     */
    function appeal(uint _disputeID) public payable {
        Arbitrator arbitrator = Arbitrator(ARBITRATOR);
        arbitrator.appeal.value(msg.value)(_disputeID, ARBITRATOR_EXTRA_DATA);
    }

    /** @dev Give a ruling for a dispute. Must be called by the arbitrator. Refunds sender if arbitrator refuses/can't rule.
     *  @param _disputeID ID of the dispute in the Arbitrator contract.
     *  @param _ruling Ruling given by the arbitrator. Note that 0 is reserved for "Not able/wanting to make a decision".
     */
    function rule(uint _disputeID, uint _ruling) public onlyArbitrator {
        emit Ruling(Arbitrator(msg.sender), _disputeID, _ruling);
        IERC20 token = IERC20(TOKEN_ADDR);

        if (RulingOptions(_ruling) == RulingOptions.ReceiverWins)
            token.transfer(RECEIVER, token.balanceOf(address(this)));
        else
            token.transfer(SENDER, token.balanceOf(address(this)));
    }
}