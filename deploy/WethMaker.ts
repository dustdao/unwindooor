import "dotenv/config";
import { DeployFunction } from "hardhat-deploy/types";
import { ChainId, FACTORY_ADDRESS, WETH9_ADDRESS } from "@sushiswap/core-sdk";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { utils } from "ethers";
import { WethMaker } from "../typechain";

const deployFunction: DeployFunction = async ({
  deployments,
  getNamedAccounts,
  getChainId,
  network,
  ethers
}: HardhatRuntimeEnvironment) => {

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = parseInt(await getChainId());

  const owner = utils.getAddress(process.env.OWNER as string);
  const user0 = utils.getAddress(process.env.TRUSTEE0 as string);
  const user1 = utils.getAddress(process.env.TRUSTEE1 as string);
  const factory = FACTORY_ADDRESS[chainId];
  const weth = chainId == ChainId.CELO ? "0x122013fd7dF1C6F636a5bb8f03108E876548b455" : WETH9_ADDRESS[chainId];
  // const weth = chainId == ChainId.AVALANCHE ? "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB" : WETH9_ADDRESS[chainId];

  const { address } = await deploy("WethMaker", {
    from: deployer,
    args: [deployer, user0, factory, weth],
  });

  // initial setup
  const wethMaker = (await ethers.getContract("WethMaker")) as WethMaker;
  await wethMaker.setTrusted(user1, true);
  await wethMaker.setOwner(owner);

  console.log(`Weth maker deployed to ${address}`);
  console.log(`Run: npx hardhat verify --network ${network.name} ${address} ${deployer} ${user0} ${factory} ${weth}`);
};

deployFunction.skip = ({ getChainId }: HardhatRuntimeEnvironment) =>
  new Promise((resolve) => {
    getChainId().then(chainId => {
      return resolve(chainId === "1") // skip if on mainnet
    })
  });

export default deployFunction;