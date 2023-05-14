// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.15;

contract Lottery {
    address public owner;
    address payable[] public players;
    uint256 public lotteryId;
    mapping(uint256 => address) public lotteryHistory;

    constructor() {
        // contract 배포자는 owner
        owner = msg.sender;
    }

    function getBalance() public view returns (uint256) {
        // 현재 contract가 보유한 이더 갯수 return
        return address(this).balance;
    }

    // storage의 players를 memory에 복사해 return
    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }

    function enter() public payable {
        // msg.sender가 보유한 ether의 양이 0.01이상일 경우만 통과
        require(
            msg.value >= 0.01 ether,
            "msg.value should be greater than or equal to 0.01 ether"
        );
        // contract 배포자를 payable로 변경, players array에 추가
        players.push(payable(msg.sender));
    }

    function getRandomNumber() public view returns (uint256) {
        // abi.encodepacked는 실제 string 값만을 concat
        return uint256(keccak256(abi.encodePacked(owner, block.timestamp)));
    }

    function getRandomNumberV2() public view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
    }

    function getRandomNumberV3() public view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp)));
    }


    function pickWinner() public onlyOwner {
        uint256 index = getRandomNumber() % players.length;

        // address payable -> address 저장 가능, 반대는 불가능
        lotteryHistory[lotteryId] = players[index];
        lotteryId++;

        // reentrancy attack 위험(재진입 공격)
        // 재진입으로 인해 상태값이 변경되는 것을 방지하기 위해 상태값을 변경하는 구문은
        // 다른 contract와의 interaction 가능성 있는 함수 실행 전 사용을 끝내야 함
        
        // players[index]에 현재 contract의 ether를 모두 전송
        // call 외에도 send와 transfer이 있지만 둘 다 소비 gas가 2300으로 고정되어 있음
        // 2019년 12월 operation code의 gas 소비량 증가, 가변적인 call 사용 추천
        (bool success, ) = players[index].call{value: address(this).balance}(
            ""
        );
        require(success, "Fail to send ether");

        // players 배열 초기화, (0)은 size를 0으로 지정
        players = new address payable[](0);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You're not owner");
        _;
    }
}
