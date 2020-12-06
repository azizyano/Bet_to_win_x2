// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.11;
pragma experimental ABIEncoderV2;

interface IStdReference {
    /// A structure returned whenever someone requests for standard reference data.
    struct ReferenceData {
        uint256 rate; // base/quote exchange rate, multiplied by 1e18.
        uint256 lastUpdatedBase; // UNIX epoch of the last time when base price gets updated.
        uint256 lastUpdatedQuote; // UNIX epoch of the last time when quote price gets updated.
    }

    /// Returns the price data for the given base/quote pair. Revert if not available.
    function getReferenceData(string memory _base, string memory _quote)
        external
        view
        returns (ReferenceData memory);

    /// Similar to getReferenceData, but with multiple base/quote pairs at once.
    function getReferenceDataBulk(string[] memory _bases, string[] memory _quotes)
        external
        view
        returns (ReferenceData[] memory);
}

contract HarmoGame {
    IStdReference ref;
    
    uint256 public price;
    uint256 public gameId;
    uint256 public lastGameId;
    address payable public admin;
    //declaring 50% chance, (0.5*(uint256+1))
    uint256 constant half = 57896044618658097711785492504343953926634992332820282019728792003956564819968;
    uint256 public randomResult;
    mapping(uint256 => Game) public games;
    
    event Withdraw(address admin, uint256 amount);
    event Received(address indexed sender, uint256 amount);
    event Result(uint256 id, uint256 bet, uint256 randomSeed, uint256 amount, address player, uint256 winAmount, uint256 randomResult, uint256 time);
    
    struct Game{uint256 id;uint256 bet;uint256 seed;uint256 amount;address payable player;}
    
    modifier onlyAdmin() {
        require(msg.sender == admin, 'caller is not the admin');
        _;
        
    }

    constructor(IStdReference _ref) public {
        ref = _ref;
        admin = msg.sender;
    }
     /* Allows this contract to receive payments */
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
    function getPrice() external view returns (uint256){
        IStdReference.ReferenceData memory data = ref.getReferenceData("ONE","USD");
        return data.rate;
    }
    
    function getMultiPrices() external view returns (uint256[] memory){
        string[] memory baseSymbols = new string[](3);
        baseSymbols[0] = "BTC";
        baseSymbols[1] = "ETH";
        baseSymbols[2] = "ONE";
         
        string[] memory quoteSymbols = new string[](3);
        quoteSymbols[0] = "USD";
        quoteSymbols[1] = "USD";
        quoteSymbols[2] = "USD";
        IStdReference.ReferenceData[] memory data = ref.getReferenceDataBulk(baseSymbols,quoteSymbols);
        
        uint256[] memory prices = new uint256[](3);
        prices[0] = data[0].rate;
        prices[1] = data[1].rate;
        prices[2] = data[2].rate;
        
        return prices;
    }
    
      /** !UPDATE
       * 
       * ethUsd - latest price from Chainlink oracles (ETH in USD * 10**8).
       * weiUsd - USD in Wei, received by dividing:
       *          ETH in Wei (converted to compatibility with etUsd (10**18 * 10**8)),
       *          by ethUsd.
       */
    function convInUsd() public view returns (uint256) {
        IStdReference.ReferenceData memory data = ref.getReferenceData("ONE","USD");
        uint256 oneUsd = data.rate;
        uint256 convUsd = oneUsd/10**18;
        return uint(convUsd);
     }
      /**
       * Taking bets function.
       * By winning, user 2x his betAmount.
       * Chances to win and lose are the same.
       */
     function game(uint256 bet, uint256 seed) public payable returns (bool) {
    
        /** !UPDATE
         * 
         * Checking if msg.value is higher or equal than $1.
        */
        uint256 convUsd = convInUsd();
        require(msg.value>=convUsd, 'Error, msg.value must be >= $1');
 
        //bet=0 is low, refers to 1-3  dice values
        //bet=1 is high, refers to 4-6 dice values
        require(bet<=1, 'Error, accept only 0 and 1');
    
        //vault balance must be at least equal to msg.value
        require(address(this).balance>=msg.value, 'Error, insufficent vault balance');
        
        //each bet has unique id
        games[gameId] = Game(gameId, bet, seed, msg.value, msg.sender);
        
        //increase gameId for the next bet
        gameId = gameId+1;
    
        callrandomResult(seed);
        return true;
     }

    function callrandomResult(uint256 Seed) public {
        randomResult = uint256(keccak256(abi.encode(now, block.number, blockhash(block.number - Seed))));

        //send final random value to the verdict();
        verdict(randomResult);
    }
    /**
   * Send rewards to the winners.
   */
    function verdict(uint256 random) public payable {
        //check bets from latest betting round, one by one
        for(uint256 i=lastGameId; i<gameId; i++){
            //reset winAmount for current user
            uint256 winAmount = 0;
            
            //if user wins, then receives 2x of their betting amount
            if((random>=half && games[i].bet==1) || (random<half && games[i].bet==0)){
            winAmount = games[i].amount*2;
            games[i].player.transfer(winAmount);
            }
            emit Result(games[i].id, games[i].bet, games[i].seed, games[i].amount, games[i].player, winAmount, random, block.timestamp);
        }
        //save current gameId to lastGameId for the next betting round
        lastGameId = gameId;
    }
  
   
    function withdraw(uint256 amount) external payable onlyAdmin {
        require(address(this).balance>=amount, 'Error, contract has insufficent balance');
        admin.transfer(amount);
        emit Withdraw(admin, amount);
  }
}