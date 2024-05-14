import { React, useState, useEffect } from "react";
import bigInt from "big-integer";
import axios from "axios";

import Web3 from "web3";

import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import { ethers } from "ethers";

import constants from "./constants.json";

function App() {
  const [information, setInformation] = useState("");
  const [block, setBlock] = useState(
    bigInt(1000000000000000000000000000000000)
  );

  const [value, setValue] = useState("");

  const [wallet, setWallet] = useState([]);

  useEffect(() => {
    // Fetch Eth price from coingecko API
    axios
      .get(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      )
      .then((res) => {
        // We get the price in usd from the response and update the state
        setValue(res.data.ethereum.usd);
      })
      .catch((err) => console.log(err));
  }, []);

  // Connecting to Mainnet
  const mainnetWeb3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://mainnet.infura.io/v3/${constants.key}`
    )
  );

  const injected = injectedModule();

  const onboard = Onboard({
    wallets: [injected],
    chains: [
      {
        id: "0x1",
        token: "ETH",
        label: "Ethereum Mainnet",
        rpcUrl: `https://mainnet.infura.io/v3/${constants.key}`,
      },
      {
        id: "0x2105",
        token: "ETH",
        label: "Base",
        rpcUrl: "https://mainnet.base.org",
      },
    ],
  });

  const getCurrentPrice = () => {
    axios
      .get(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      )
      .then((res) => {
        // We get the price in usd from the response and update the state
        console.log("res.data", res.data);
        setValue(res.data.ethereum.usd);
        setInformation("Current Price: ");
      })
      .catch((err) => console.log(err));
  };

  const connectMetamask = () => {
    onboard.connectWallet().then((wallet) => {
      if (wallet.length > 0) {
        setWallet(wallet);
        setInformation("Connected Metamask wallet successfully!");
      }
    });
  };

  const getBlock = () => {
    mainnetWeb3.eth
      .getBlockNumber()
      .then((latest) => {
        setBlock(latest);

        mainnetWeb3.eth.getBlockTransactionCount(latest).then((cnt) => {
          setInformation("Latest block number and transaction count are:");
          setValue(`${latest}, transaction count: ${cnt}`);
        });
      })
      .catch((error) => {
        console.log("An error occurred: ", error);
      });
  };

  const getLatestBlockHash = () => {
    mainnetWeb3.eth.getBlock(block).then((blockData) => {
      // Log the hash of the previous block
      setValue(
        "parent hash: " +
          blockData.parentHash +
          ", current hash: " +
          blockData.hash
      );
    });
  };

  const getBalance = () => {
    mainnetWeb3.eth.getBalance(constants.my_address).then((balance) => {
      setValue("$" + mainnetWeb3.utils.fromWei(balance, "ether") * value);
      setInformation(`Balance of ${constants.my_address} is: `);
    });
  };

  const sendTransaction = () => {
    // Build the transaction object
    const transactionObject = {
      from: constants.my_address,
      to: constants.receive_address,
      value: mainnetWeb3.utils.toWei("0.00000000000000000000000001", "ether"),
    };

    // Sign and send the transaction
    mainnetWeb3.eth
      .sendTransaction(transactionObject)
      .on("transactionHash", (hash) => {
        console.log("Transaction hash:", hash);
      })
      .on("receipt", (receipt) => {
        console.log("Transaction receipt:", receipt);
      })
      .on("error", (error) => {
        console.error("Error:", error);
      });
  };

  const sendTransactionByMetaMask = () => {
    if (wallet[0]) {
      // create an ethers provider with the last connected wallet provider
      const ethersProvider = new ethers.providers.Web3Provider(
        wallet[0].provider,
        "any"
      );
      // if using ethers v6 this is:
      // ethersProvider = new ethers.BrowserProvider(wallet.provider, 'any')
      const signer = ethersProvider.getSigner();
      // send a transaction with the ethers provider
      signer
        .sendTransaction({
          to: constants.receive_address,
          value: 100000000000000,
        })
        .then((txn) => {
          txn.wait().then((receipt) => {
            console.log("receipt ---------- ", receipt);
          });
        });
    }
  };

  return (
    <div className="container-fluid">
      <br />
      <h4>{information}</h4>
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        readOnly
      ></input>
      <br />
      <button className="btn btn-outline-primary" onClick={getCurrentPrice}>
        Current Price
      </button>
      <button className="btn btn-outline-success" onClick={connectMetamask}>
        Connect Metamask
      </button>
      <button className="btn btn-outline-info" onClick={getBlock}>
        Get Latest Block
      </button>
      <button
        className="btn btn-outline-secondary"
        onClick={getLatestBlockHash}
      >
        Get Latest Block Hash
      </button>
      <button className="btn btn-outline-warning" onClick={getBalance}>
        Get Balance
      </button>

      <button
        className="btn btn-outline-danger"
        onClick={sendTransaction}
        disabled
      >
        Send Transaction
      </button>
      <button
        className="btn btn-outline-dark"
        onClick={sendTransactionByMetaMask}
      >
        Send Transaction By Metamask
      </button>
    </div>
  );
}

export default App;
