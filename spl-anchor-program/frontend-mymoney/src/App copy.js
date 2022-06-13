import logo from './logo.svg';
import './App.css';


import React, { useEffect, useState } from "react"
import { Program, AnchorProvider, web3 } from "@project-serum/anchor"
// import { Connection } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor"
import * as serumCmn from "@project-serum/common"
import { TokenInstructions } from "@project-serum/serum"

// import * as Token from "@project-serum/serum/lib/token-instructions"
import idl from "./idl/mymoneydapp.json"

console.log('\n=====> SPL Token Address: ', TokenInstructions.TOKEN_PROGRAM_ID.toString(), '\n\n')

const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
  TokenInstructions.TOKEN_PROGRAM_ID.toString()

);

let baseAccount = null;
let connection = null;
let provider = null;
let mint = null;
let from = null;
let to = null;

function App() {


  // ********************** custom code start **************************** 
  // ********************** connect to phantom wallet start **************************** 
  // check wallet connected or not
  let [walletAddress, setWalletAddress] = useState(null);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log("Phanton wallet found!");
          // chech user login or not 
          // await window.solana.signMessage();
          // window.solana.on("connect", () => console.log("connected!"))
          // window.solana.request({ method: "connect", params: { onlyIfTrusted: true }});
          const wallet = await window.solana.connect({ onlyIfTrusted: true });
          console.log("\n=====> Connected with:", wallet, '\n\n');
          setWalletAddress(wallet);
        } else {
          alert("Solana object not found! Get a Phantom Wallet!");
        }
      }
    }
    catch (error) {
      console.error(error);
    }
  };

  const connectwallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await window.solana.connect();
      console.log("Connected with Public Key:", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button"
      onClick={connectwallet} >
      Connect to Wallet </button>
  );

  useEffect(() => {
    const onload = async () => {
      await checkIfWalletIsConnected();
    };

    window.addEventListener("load", onload);
    return () => window.removeEventListener("load", onload);
  }, []);


  // ********************** connect to phantom wallet end **************************** 



  // ********************** create tokrn accounts start **************************** 

  const renderCreateAllTokenAccount = () => (
    <button className="cta-button connect-wallet-button"
      onClick={createAllTokenAccount} >
      Create Token Accounts </button>
  );

  function createAllTokenAccount() {
    baseAccount = walletAddress;

    // const idl_string = JSON.stringify(idl)
    // const idl_json = JSON.parse(idl_string)

    // const network = "https://api.devnet.solana.com"
    // const connection = new Connection(network, "processed")
    const preflightCommitment = 'processed'
    const commitment = 'processed'
    connection = new web3.Connection(web3.clusterApiUrl('devnet'), commitment)
    // const provider = new AnchorProvider(connection, baseAccount, { preflightCommitment, commitment });
    provider = new AnchorProvider(connection, baseAccount, anchor.AnchorProvider.defaultOptions());
    // const provider = anchor.AnchorProvider.env();
    console.log('\n=====> Provider: ', provider, '\n\n')
    const program = new Program(idl, idl.metadata.address, provider)
    console.log('\n=====> Program: ', program, '\n\n')

    try{
      mint = createMint(connection, provider, provider.wallet.publicKey)
      // from = createTokenAccount(connection, provider, mint, provider.wallet.publicKey)
      // to = createTokenAccount(connection, provider, mint, provider.wallet.publicKey)
    }catch{
      console.log('=====> Error in create token accounts.')
    }

  }

  // ********************** create tokrn accounts end **************************** 









  async function createMint(connection, provider, authority) {
    if (authority === undefined) {
      authority = provider.wallet.publicKey;
    }
    const mint = web3.Keypair.generate();
    const instructions = await createMintInstructions(
      provider,
      authority,
      mint.publicKey
    );

    const tx = new anchor.web3.Transaction();
    tx.add(...instructions);

    // const signature = await provider.send(tx, [mint]);

    // while (blockheight < lastValidBlockHeight) {
    //   connection.sendRawTransaction(rawTransaction, {
    //     skipPreflight: true,
    //   });
    //   await sleep(500);
    //   blockheight = await connection.getBlockHeight();
    // }
    // console.log('\n\n\n=====> BlockHeight', blockheight = await connection.getBlockHeight())
    console.log("159", provider.wallet)
    console.log('1:', connection, '\n2:', tx, '\n3:', baseAccount, '\n4:', mint.publicKey.toBase58(), '\n')
    const signature = await web3.sendAndConfirmTransaction(connection, tx, [provider.wallet, mint])
    console.log('=====> signature: ', signature)
    console.log('=====> minter: ', mint.publicKey.toBase58())
    return mint.publicKey;
  }

  async function createMintInstructions(provider, authority, mint) {
    let instructions = [
      web3.SystemProgram.createAccount({
        fromPubkey: authority,
        newAccountPubkey: mint,
        space: 82,
        lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
        programId: TOKEN_PROGRAM_ID,
      }),
      TokenInstructions.initializeMint({
        mint,
        decimals: 0,
        mintAuthority: authority,
      }),
    ];
    return instructions;
  }

  async function createTokenAccount(connection, provider, mint, owner) {
    // const newAccount = anchor.web3.Keypair.generate();
    const newAccount = web3.Keypair.generate();
    const instructions = await createTokenAccountInstrs(
      provider,
      newAccount.publicKey,
      mint,
      owner
    );

    // const tx = new anchor.web3.Transaction();
    const tx = new web3.Transaction();
    tx.add(...instructions);

    // await provider.send(tx, [newAccount]);
    const signature = await web3.sendAndConfirmTransaction(connection, tx, [provider.wallet, newAccount])
    console.log('=====> signature: ', signature)
    console.log('=====> tokenAccount: ', newAccount.publicKey.toBase58())
    return newAccount.publicKey;
  }

  async function createTokenAccountInstrs(
    provider,
    newAccountPubkey,
    mint,
    owner
  ) {
    return [
      // anchor.web3.SystemProgram.createAccount({
      web3.SystemProgram.createAccount({
        fromPubkey: owner,
        newAccountPubkey: newAccountPubkey,
        space: 165,
        lamports: await provider.connection.getMinimumBalanceForRentExemption(165),
        programId: TOKEN_PROGRAM_ID,
      }),
      TokenInstructions.initializeAccount({
        account: newAccountPubkey,
        mint: mint,
        owner: owner,
      }),
    ];
  }
  // ********************** custom code end **************************** 




  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>

        {!walletAddress && renderNotConnectedContainer()}
        {walletAddress && renderCreateAllTokenAccount()}

        <a
          href="https://phantom.app/"
          target="_blank"
          className="bg-purple-500 px-4 py-2 border border-transparent rounded-md text-base font-medium text-white"
        >
          Get Phantom
        </a>
      </header>
    </div>
  );
}




export default App;
