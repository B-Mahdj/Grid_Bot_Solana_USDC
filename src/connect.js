require('dotenv').config();
const {Keypair} = require("@solana/web3.js");

//Create a Uint8Array from process.env.SOLANA_ACCOUNT_SECRET_KEY
const secretKey = new Uint8Array(process.env.SOLANA_ACCOUNT_SECRET_KEY.split(','));

export const keypair =  Keypair.fromSecretKey(secretKey);

console.log(keypair);
