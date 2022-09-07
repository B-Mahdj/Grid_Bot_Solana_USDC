require('dotenv').config();
import {getWSolBalance} from "../src/getTokens";
import { getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Wallet } from "@project-serum/anchor";
const connection = new Connection(process.env.SOLANA_RPC_URL, {
    commitment: 'finalized',
    wsEndpoint: process.env.SOLANA_WS_ENDPOINT,
});

async function move_all_wsol_to_main_account() {

    var secretKeyJSON = process.env.SOLANA_ACCOUNT_SECRET_KEY.split(',');
    var secretKeyJSONToNumber = secretKeyJSON.map(str => {
        return Number(str);
    });

    var secretKey = new Uint8Array(secretKeyJSONToNumber);
    const fromWallet = Keypair.fromSecretKey(secretKey);
    const fromAddress = "5CJCHjV5DyzJyN75PuQqJrHNxKhFo1PTgrbuBjQ8anXX";
    const toAddress = "DYFsKBpkL2RRUPfKow6yzyA3smSHN37UKXSqEbXqLd2y";
    const tokenAddress = "So11111111111111111111111111111111111111112";


    const fromPublicKey = new PublicKey(fromAddress);
    const toPublicKey = new PublicKey(toAddress);
    const tokenPublicKey = new PublicKey(tokenAddress);


    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        tokenPublicKey,
        fromPublicKey,
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        tokenPublicKey,
        toPublicKey,
    );

    const signature = await transfer(
        connection,
        fromWallet,
        fromTokenAccount.address,
        toTokenAccount.address,
        fromWallet.publicKey, // or pass fromPublicKey
        await getWSolBalance(new Wallet(fromWallet).publicKey.toString(), connection) * LAMPORTS_PER_SOL
    );

    console.log(`https://solscan.io/tx/${signature}`);
}

move_all_wsol_to_main_account();