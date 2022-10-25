require('dotenv').config();
import {getUSDCBalance, getWSolBalance} from "../src/getTokens";
import { getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Wallet } from "@project-serum/anchor";
const connection = new Connection(process.env.SOLANA_RPC_URL, {
    commitment: 'finalized',
    wsEndpoint: process.env.SOLANA_WS_ENDPOINT,
});

// Create an array of 10 string with 10 hard coded values
const wallets = [   
    '185,196,105,38,96,117,20,164,55,240,8,127,255,142,152,46,45,114,84,80,81,226,241,171,22,238,87,171,3,46,107,59,67,78,37,35,23,29,61,177,34,39,124,249,105,85,232,103,115,148,164,159,107,240,189,159,105,10,237,100,100,68,231,142',
    '178,245,172,212,87,61,232,180,38,39,174,56,35,112,246,132,76,69,165,3,188,110,27,57,0,18,128,169,237,14,161,198,205,231,31,245,182,229,208,143,106,6,159,107,28,117,141,75,96,27,151,22,231,106,149,189,39,114,36,87,125,16,202,38',
    '208,26,238,99,1,53,231,208,178,97,102,102,194,58,153,105,70,32,133,128,70,172,107,203,197,7,199,115,85,226,192,118,16,204,123,242,250,91,4,55,61,252,235,201,165,122,13,246,56,36,224,208,141,207,231,243,29,118,139,74,211,2,251,27',
    '23,187,27,247,140,117,104,21,111,240,117,150,202,191,238,129,27,167,255,147,139,125,20,180,223,214,229,4,243,38,233,225,146,104,163,26,236,243,49,178,210,188,18,89,207,73,225,6,55,95,45,133,132,146,133,126,251,118,211,70,76,40,77,220',
    '70,223,117,218,185,100,24,228,224,209,1,105,61,63,198,239,11,73,127,221,170,69,32,250,23,239,99,8,144,17,226,69,242,67,227,226,226,243,151,15,84,177,16,185,129,134,230,208,138,59,6,120,48,43,78,147,94,228,95,240,96,88,163,40',
    '94,28,95,173,149,51,94,38,78,120,211,187,132,46,8,41,78,35,136,238,101,76,217,184,227,89,202,108,132,112,144,124,163,253,234,6,184,116,61,104,97,249,16,20,77,180,168,155,59,105,2,40,139,210,191,111,107,46,28,55,30,114,145,52',
    '255,78,18,165,238,120,18,193,64,30,2,56,171,203,178,77,120,223,25,245,243,118,101,213,253,122,27,184,161,64,104,229,4,43,186,235,213,40,142,41,93,222,134,90,194,51,179,73,14,204,154,8,26,215,205,195,78,110,219,141,207,95,237,206',
    '85,37,86,98,114,147,227,62,156,163,43,45,10,57,144,3,62,31,198,26,156,159,216,64,58,55,53,103,97,123,189,136,169,209,237,235,244,169,103,31,154,110,131,252,205,179,194,210,42,21,104,84,55,18,228,6,119,245,129,42,5,171,202,236',
    '208,142,0,29,253,218,84,180,89,81,80,123,105,196,114,116,104,162,68,249,157,156,181,111,220,234,203,54,251,95,23,164,127,187,28,149,11,158,234,82,217,88,247,6,156,15,223,70,41,122,93,130,92,25,140,251,76,245,123,134,138,59,173,128',
    '131,109,93,185,170,47,37,135,194,12,40,132,33,14,169,24,153,76,241,194,0,1,228,165,130,176,90,166,138,177,128,183,154,117,195,198,241,215,205,186,60,149,92,26,127,213,214,129,71,226,22,248,184,240,20,198,141,168,88,17,130,34,162,110',
];

//Create a loop size of wallets
for (let i = 0; i < wallets.length; i++) {
    try{
        move_all_wsol_to_main_account(wallets[i]);
        move_all_usdc_to_main_account(wallets[i]);
    }
    catch (e) {
        console.log(e);
    }
}

async function move_all_wsol_to_main_account(SolanaSecretKey:string) {

    var secretKeyJSON = SolanaSecretKey.split(',');
    var secretKeyJSONToNumber = secretKeyJSON.map(str => {
        return Number(str);
    });

    var secretKey = new Uint8Array(secretKeyJSONToNumber);
    const fromWallet = Keypair.fromSecretKey(secretKey);
    const fromAddress = fromWallet.publicKey.toString();
    const toAddress = "DYFsKBpkL2RRUPfKow6yzyA3smSHN37UKXSqEbXqLd2y";
    const tokenAddress = "So11111111111111111111111111111111111111112";

    const fromPublicKey = new PublicKey(fromAddress);
    const toPublicKey = new PublicKey(toAddress);
    const tokenPublicKey = new PublicKey(tokenAddress);

    const amountOfWSolToTransfer = await getWSolBalance(new Wallet(fromWallet).publicKey.toString(), connection) * LAMPORTS_PER_SOL;
    console.log("amountOfWSolToTransfer", amountOfWSolToTransfer);

    if(amountOfWSolToTransfer > 0){
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
            amountOfWSolToTransfer,
            undefined,
            { skipPreflight : true}
        );

        console.log(`https://solscan.io/tx/${signature}`);
    }
}

async function move_all_usdc_to_main_account(SolanaSecretKey:string) {
    var secretKeyJSON = SolanaSecretKey.split(',');
    var secretKeyJSONToNumber = secretKeyJSON.map(str => {
        return Number(str);
    });

    var secretKey = new Uint8Array(secretKeyJSONToNumber);
    const fromWallet = Keypair.fromSecretKey(secretKey);
    const fromAddress = fromWallet.publicKey.toString();
    const toAddress = "DYFsKBpkL2RRUPfKow6yzyA3smSHN37UKXSqEbXqLd2y";
    const tokenAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    const fromPublicKey = new PublicKey(fromAddress);
    const toPublicKey = new PublicKey(toAddress);
    const tokenPublicKey = new PublicKey(tokenAddress);

    const amountOfUSDCToTransfer = await getUSDCBalance(new Wallet(fromWallet).publicKey.toString(), connection) * +process.env.DECIMALS_PER_USDC;
    console.log("amountOfUSDCToTransfer", amountOfUSDCToTransfer);

    if(amountOfUSDCToTransfer > 0){
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
            amountOfUSDCToTransfer,
            undefined,
            { skipPreflight : true}
        );

        console.log(`https://solscan.io/tx/${signature}`);
    }
}
