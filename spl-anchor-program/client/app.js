const { Program, AnchorProvider, web3 } = require("@project-serum/anchor")
// const { Connection } = require("@solana/web3.js")
const anchor = require("@project-serum/anchor");
const TokenInstructions = require("@project-serum/serum").TokenInstructions;
const serumCmn = require("@project-serum/common");

console.log('\n\n\n=====> SPL Token Address: ', TokenInstructions.TOKEN_PROGRAM_ID.toString())
const idl = JSON.parse(
  require("fs").readFileSync("../target/idl/mymoneydapp.json", "utf8")
);

const Keypair = require('./my-solana-wallet/wallet-GeKRGQZwgxVQ5ojsGKukSMptEhyg9r4YrKjgWPrEqScm.json')
// const baseAccount = web3.Keypair.fromSeed(Uint8Array.from(Keypair.slice(0,32)));
// const baseAccount = web3.Keypair.fromSecretKey(Uint8Array.from(Keypair));
const baseAccount = new anchor.Wallet(web3.Keypair.fromSecretKey(Uint8Array.from(Keypair)));
console.log('\n=====> : wallet account: ', baseAccount.publicKey.toBase58(), '\n\n\n')

// const baseAccount = web3.Keypair.generate()

const idl_string = JSON.stringify(idl)
const idl_json = JSON.parse(idl_string)

// const network = "https://api.devnet.solana.com"
// const connection = new Connection(network, "processed")
const preflightCommitment = 'processed'
const commitment = 'processed'
const connection = new web3.Connection(web3.clusterApiUrl('devnet'), commitment)
const provider = new AnchorProvider(connection, baseAccount, { preflightCommitment, commitment });
// const provider = new AnchorProvider(connection, baseAccount, anchor.AnchorProvider.defaultOptions());
// const provider = anchor.AnchorProvider.env();



const newKeypair = require('./my-solana-wallet/transfer-Dw2jgWmpEHBkymfqcba9SiyTbBT5dRY1CXS6FoebFZtt.json')
const newMintAuthority = new anchor.Wallet(web3.Keypair.fromSecretKey(Uint8Array.from(newKeypair)));
// const provider = new AnchorProvider(connection, newMintAuthority, anchor.AnchorProvider.defaultOptions());


const program = new Program(idl_json, idl_json.metadata.address, provider)

// console.log('\n\n\n=====> Provider: ', provider)
// console.log('\n\n\n=====> Program: ', program)
// console.log('\n\n\n=====> Program Address: ', idl_json.metadata.address)





async function main() {
  let mint = null;
  let from = null;
  let to = null;
  let newAccount = null;

  // mint = require('./my-solana-wallet/mint-4SAGrJdyq4oFiQhbu3NE2ALSv4umzAN1gPHpi7maFrwe.json')
  // mint = web3.Keypair.fromSeed(Uint8Array.from(mint.slice(0,32)));
  // from = require('./my-solana-wallet/from-nfVpyPoHkjhVRe1WeA5D5uXa39LjFc4hehxVUbtXsrt.json')
  // from = web3.Keypair.fromSeed(Uint8Array.from(from.slice(0,32)));
  // to = require('./my-solana-wallet/to-5sxb4ceXXpj2VSqFGZzUgaym4SMEYgqJAc2fPZmhJzja.json')
  // to = web3.Keypair.fromSeed(Uint8Array.from(to.slice(0,32)));


  mint = new web3.PublicKey('4SAGrJdyq4oFiQhbu3NE2ALSv4umzAN1gPHpi7maFrwe')
  // mint = await createMint(connection, provider, provider.wallet.publicKey)
  from = new anchor.web3.PublicKey('nfVpyPoHkjhVRe1WeA5D5uXa39LjFc4hehxVUbtXsrt')
  // from = await createTokenAccount(connection, provider, mint, provider.wallet.publicKey)
  to = new anchor.web3.PublicKey('5sxb4ceXXpj2VSqFGZzUgaym4SMEYgqJAc2fPZmhJzja')
  // to = await createTokenAccount(connection, provider, mint, provider.wallet.publicKey)

  const currentMintAuthority = provider.wallet.publicKey


  // await mint_tokens(provider, program, currentMintAuthority, mint, from)
  // await transfer_tokens(provider, program, currentMintAuthority, from, to)
  // await burn_tokens(provider, program, currentMintAuthority, mint, to)
  await change_mint_authority(provider, program, currentMintAuthority, mint, newMintAuthority.publicKey)
  // await change_mint_authority(provider, program, currentMintAuthority, mint, baseAccount.publicKey)
  token_account_status(provider, mint, from, to )
}

main()


//=========================== call token program methods start ===============================

async function mint_tokens(provider, program, authority, mint, from) {
  // await program.methords.proxyMintTo().rpc(new anchor.BN(500), {
    await program.rpc.proxyMintTo(new anchor.BN(100), {
    accounts: {
      authority,
      mint,
      to: from,
      tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
    },
  });

  const mintTokenInfo = await serumCmn.getMintInfo(provider, mint);
  const fromAccount = await serumCmn.getTokenAccount(provider, from);
  console.log('\n\n\n******* mint_tokens ******* ')
  console.log('=====> mintTokenAuthority: ', mintTokenInfo.mintAuthority.toBase58())
  console.log('=====> mintTokenSupply: ', mintTokenInfo.supply.toString())
  console.log('=====> fromAccount amount: ', fromAccount.amount.toString())
}

async function transfer_tokens(provider, program, authority, from, to) {
  await program.rpc.proxyTransfer(new anchor.BN(200), {
    accounts: {
      authority: authority,
      to,
      from,
      tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
    },
  });

  const fromAccount = await serumCmn.getTokenAccount(provider, from);
  const toAccount = await serumCmn.getTokenAccount(provider, to);
  console.log('\n******* transfer_tokens ******* ')
  console.log('=====> fromAccount amount: ', fromAccount.amount.toString())
  console.log('=====> toAccount amount: ', toAccount.amount.toString())
}

async function burn_tokens(provider, program, authority, mint, to) {
  await program.rpc.proxyBurn(new anchor.BN(100), {
    accounts: {
      authority: authority,
      mint,
      to,
      tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
    },
  });

  const toAccount = await serumCmn.getTokenAccount(provider, to)
  console.log('\n******* burn_tokens ******* ')
  console.log('=====> toAccount amount: ', toAccount.amount.toString())
}

async function change_mint_authority(provider, program, authority, mint, newMintAuthority) {
  await program.rpc.proxySetAuthority(
    { mintTokens: {}, accountOwner: {} },
    newMintAuthority,
    {
      accounts: {
        accountOrMint: mint,
        currentAuthority: authority,
        tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
      },
    }
  );

  const mintTokenInfo = await serumCmn.getMintInfo(provider, mint);
  console.log('\n******* change_mint_authority ******* ')
  console.log('=====> mintTokenAuthority: ', mintTokenInfo.mintAuthority.toString())
  console.log('=====> mintTokenSupply: ', mintTokenInfo.supply.toString())
}

async function token_account_status(provider, mint, from, to ){
  const mintTokenInfo = await serumCmn.getMintInfo(provider, mint);
  const fromAccount = await serumCmn.getTokenAccount(provider, from);
  const toAccount = await serumCmn.getTokenAccount(provider, to);
  console.log('\n\n\n******* token_account_status ******* ')
  // console.log('=====> mintTokenSupply: ', mintTokenInfo)
  console.log('=====> mintTokenAuthority: ', mintTokenInfo.mintAuthority.toBase58())
  console.log('=====> mintTokenDecimals: ', mintTokenInfo.decimals)
  console.log('=====> mintTokenSupply: ', mintTokenInfo.supply.toString())
  console.log('=====> fromAccount amount: ', fromAccount.amount.toString())
  console.log('=====> toAccount amount: ', toAccount.amount.toString())
}
//=========================== call token program methods end ===============================






//=========================== create token accounts start ===============================

async function createMint(connection, provider, authority) {
  if (authority === undefined) {
    authority = provider.wallet.publicKey;
  }
  // const mint = web3.Keypair.generate();
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
  console.log('1:', connection, '\n2:', tx, '\n3:', provider.wallet.payer, '\n4:', mint.publicKey.toBase58(), '\n')
  const signature = await web3.sendAndConfirmTransaction(connection, tx, [provider.wallet.payer, mint])
  console.log('\n=====> signature: ', signature)
  console.log('\n=====> minter: ', mint.publicKey.toBase58())
  return mint.publicKey;
}

async function createMintInstructions(provider, authority, mint) {
  let instructions = [
    web3.SystemProgram.createAccount({
      fromPubkey: authority,
      newAccountPubkey: mint,
      space: 82,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
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
  // const newAccount = web3.Keypair.generate();
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
  const signature = await web3.sendAndConfirmTransaction(connection, tx, [provider.wallet.payer, newAccount])
  console.log('\n=====> signature: ', signature)
  console.log('\n=====> tokenAccount: ', newAccount.publicKey.toBase58())
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
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeAccount({
      account: newAccountPubkey,
      mint: mint,
      owner: owner,
    }),
  ];
}
//=========================== create token accounts end ===============================

