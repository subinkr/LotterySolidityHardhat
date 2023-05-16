const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");
const { ethers, network } = require("hardhat");
const { expect } = require("chai");

describe("CommitRevealLottery", () => {
  async function deployCommitRevealLottery() {
    const Signers = await ethers.getSigners();

    const CommitRevealLotteryContract = await ethers.getContractFactory("CommitRevealLottery");
    const CommitRevealLottery = await CommitRevealLotteryContract.deploy();

    return { CommitRevealLottery, Signers };
  }

  async function findMatchingSigner(Signers, account) {
    for(let i = 0 ; i < Signers.length; i++) {
      if(account == Signers[i].address) {
        return Signers[i];
      }
    }
    return null;
  }

  let commitRevealLottery;
  let signers;

  before(async() => {
    const { CommitRevealLottery, Signers } = await loadFixture(deployCommitRevealLottery);
    commitRevealLottery = CommitRevealLottery;
    signers = Signers;
  });

  describe("Constructor", () => {
    it("commitCloses & revealCloses should be set correctly", async () => {
      const commitCloses = await commitRevealLottery.commitCloses();
      const revealCloses = await commitRevealLottery.revealCloses();
      const duration = await commitRevealLottery.DURATION();
      console.log(`commitCloses: ${commitCloses}, revealCloses: ${revealCloses}, duration: ${duration}`);

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      console.log(`current block number: ${currentBlockNumber}`);

      expect(commitCloses).to.equal(duration.add(currentBlockNumber));
      expect(revealCloses).to.equal(commitCloses.add(duration));
    });
  });

  describe("Enter", () => {
    it("Should revert if a player enters less than 0.01 ether", async () => {
      const enterAmt = ethers.utils.parseEther("0.009");

      const secret = 12345;
      const commit = ethers.utils.solidityKeccak256(["address", "uint256"], [signers[1].address, secret]);
      console.log(`commmit: ${commit}`);

      await expect(commitRevealLottery.connect(signers[1]).enter(commit, { value: enterAmt })).to.be.
        revertedWith("msg.value should be greater than or equal to 0.01 ether");
    });

    it("Enter 3 players and check values", async() => {
      const enterAmt = ethers.utils.parseEther("0.01");

      const secret1 = 12345;
      const commit1 = ethers.utils.solidityKeccak256(["address", "uint256"], [signers[1].address, secret1]);
      console.log(`commmit1: ${commit1}`);

      await commitRevealLottery.connect(signers[1]).enter(commit1, { value: enterAmt });
      expect(await commitRevealLottery.getBalance()).to.equal(enterAmt);
      expect(await commitRevealLottery.commitments(signers[1].address)).to.equal(commit1);

      const secret2 = 12346;
      const commit2 = ethers.utils.solidityKeccak256(["address", "uint256"], [signers[2].address, secret2]);
      console.log(`commmit2: ${commit2}`);

      await commitRevealLottery.connect(signers[2]).enter(commit2, { value: enterAmt });
      expect(await commitRevealLottery.getBalance()).to.equal(enterAmt.mul(2));
      expect(await commitRevealLottery.commitments(signers[2].address)).to.equal(commit2);

      const secret3 = 12347;
      const commit3 = ethers.utils.solidityKeccak256(["address", "uint256"], [signers[3].address, secret3]);
      console.log(`commmit3: ${commit3}`);

      await commitRevealLottery.connect(signers[3]).enter(commit3, { value: enterAmt });
      expect(await commitRevealLottery.getBalance()).to.equal(enterAmt.mul(3));
      expect(await commitRevealLottery.commitments(signers[3].address)).to.equal(commit3);

      const secret4 = 12348;
      const commit4 = ethers.utils.solidityKeccak256(["address", "uint256"], [signers[4].address, secret4]);
      console.log(`commmit4: ${commit4}`);

      await expect(commitRevealLottery.connect(signers[4]).enter(commit4, { value: enterAmt })).to.be.revertedWith("commit duration is over");
    });
  });

  describe("Reveal", () => {
    it("Reveal 3 players", async () => {
      const secret1 = 12345;
      const commit1 = ethers.utils.solidityKeccak256(["address", "uint256"], [signers[1].address, secret1]);
      console.log(`commmit1: ${commit1}`);

      let commit = await commitRevealLottery.connect(signers[1]).createCommitment(secret1);
      expect(commit).to.equal(commit1);

      let isAlreadyRevealed = await commitRevealLottery.connect(signers[1]).isAlreadyRevealed();
      expect(isAlreadyRevealed).to.equal(false);

      await commitRevealLottery.connect(signers[1]).reveal(secret1);

      isAlreadyRevealed = await commitRevealLottery.connect(signers[1]).isAlreadyRevealed();
      expect(isAlreadyRevealed).to.equal(true);

      await expect(commitRevealLottery.connect(signers[1]).reveal(secret1)).to.be.revertedWith("You already revealed");

      const player1 = await commitRevealLottery.players(0);
      expect(player1).to.equal(signers[1].address);

      const secret2 = 12346;
      const commit2 = ethers.utils.solidityKeccak256(["address", "uint256"], [signers[2].address, secret2]);
      console.log(`commmit2: ${commit2}`);

      commit = await commitRevealLottery.connect(signers[2]).createCommitment(secret2);
      expect(commit).to.equal(commit2);

      isAlreadyRevealed = await commitRevealLottery.connect(signers[2]).isAlreadyRevealed();
      expect(isAlreadyRevealed).to.equal(false);

      await commitRevealLottery.connect(signers[2]).reveal(secret2);

      isAlreadyRevealed = await commitRevealLottery.connect(signers[2]).isAlreadyRevealed();
      expect(isAlreadyRevealed).to.equal(true);

      await expect(commitRevealLottery.connect(signers[2]).reveal(secret2)).to.be.revertedWith("You already revealed");

      const player2 = await commitRevealLottery.players(1);
      expect(player2).to.equal(signers[2].address);

      const secret3 = 12347;
      const commit3 = ethers.utils.solidityKeccak256(["address", "uint256"], [signers[3].address, secret3]);
      console.log(`commmit3: ${commit3}`);

      commit = await commitRevealLottery.connect(signers[3]).createCommitment(secret3);
      expect(commit).to.equal(commit3);

      isAlreadyRevealed = await commitRevealLottery.connect(signers[3]).isAlreadyRevealed();
      expect(isAlreadyRevealed).to.equal(false);

      await commitRevealLottery.connect(signers[3]).reveal(secret3);

      isAlreadyRevealed = await commitRevealLottery.connect(signers[3]).isAlreadyRevealed();
      expect(isAlreadyRevealed).to.equal(true);

      await expect(commitRevealLottery.connect(signers[3]).reveal(secret3)).to.be.revertedWith("You already revealed");

      const player3 = await commitRevealLottery.players(2);
      expect(player3).to.equal(signers[3].address);

      let currentBlockNumber = await ethers.provider.getBlockNumber();
      console.log(`current block number: ${currentBlockNumber}`);

      await network.provider.send("hardhat_mine", ["0x1"]);
      currentBlockNumber = await ethers.provider.getBlockNumber();
      console.log(`current block number: ${currentBlockNumber}`);

      await expect(commitRevealLottery.connect(signers[3]).reveal(secret3)).to.be.revertedWith("reveal duration is already closed");
    });
  });

  describe("PickWinner", () => {
    it("PickWinner", async() => {
      await commitRevealLottery.connect(signers[1]).pickWinner();

      const winner = await commitRevealLottery.winner();
      const lotteryId = await commitRevealLottery.lotteryId();
      expect(lotteryId).to.equal(1);
      expect(await commitRevealLottery.lotteryHistory(lotteryId - 1)).to.equal(winner);
    });
  });

  describe("WithdrawPrize", () => {
    it("WithdrawPrize", async() => {
      console.log(">>> before withdrawPrize");

      for(let i = 1; i <= 3; i++) {
        console.log(`signers[${i}] address: ${signers[i].address}`);
      }

      const account1EthBal_bef = await ethers.provider.getBalance(signers[1].address);
      console.log(`account1's ETH balance: ${account1EthBal_bef}`);
      const account2EthBal_bef = await ethers.provider.getBalance(signers[2].address);
      console.log(`account2's ETH balance: ${account2EthBal_bef}`);
      const account3EthBal_bef = await ethers.provider.getBalance(signers[3].address);
      console.log(`account3's ETH balance: ${account3EthBal_bef}`);

      console.log(">>> withdrawPrize");

      await expect(commitRevealLottery.withdrawPrize()).to.be.revertedWith("You're not winner");

      let winner = await commitRevealLottery.winner();
      console.log(`winner: ${winner}`);

      const winnerSigner = await findMatchingSigner(signers, winner);
      await commitRevealLottery.connect(winnerSigner).withdrawPrize();

      console.log(">>> after withdrawPrize");

      const account1EthBal_aft = await ethers.provider.getBalance(signers[1].address);
      console.log(`account1's ETH balance: ${account1EthBal_aft}`);
      const account2EthBal_aft = await ethers.provider.getBalance(signers[2].address);
      console.log(`account2's ETH balance: ${account2EthBal_aft}`);
      const account3EthBal_aft = await ethers.provider.getBalance(signers[3].address);
      console.log(`account3's ETH balance: ${account3EthBal_aft}`);

      console.log(`account1 balance difference: ${account1EthBal_aft.sub(account1EthBal_bef)}`);
      console.log(`account2 balance difference: ${account2EthBal_aft.sub(account2EthBal_bef)}`);
      console.log(`account3 balance difference: ${account3EthBal_aft.sub(account3EthBal_bef)}`);

      winner = await commitRevealLottery.winner();
      expect(winner).to.equal(ethers.constants.AddressZero);

      for(let i = 1; i <= 3; i++) {
        let commit = await commitRevealLottery.commitments(signers[i].address);
        expect(commit).to.equal(ethers.constants.HashZero);
      }

      await expect(commitRevealLottery.players(0)).to.be.reverted;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const commitCloses = await commitRevealLottery.commitCloses();
      const revealCloses = await commitRevealLottery.revealCloses();
      const duration = await commitRevealLottery.DURATION();

      expect(commitCloses).to.equal(duration.add(currentBlockNumber));
      expect(revealCloses).to.equal(commitCloses.add(duration));
    });
  });
});