require('dotenv').config();
const {Keypair, Wallet} = require("@solana/web3.js");
const { default: axios } = require('axios');

launch();

async function launch(){
    // Step 1 : Connect to the Solana Wallet 
    const wallet = await getSolanaWallet();

    // Step 2 : Get the Solana price info
    const solanaInfo = await getSolInfo();
    console.log("Solana initial Info : ", solanaInfo);
}


async function getSolInfo() {
    const solInfo = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`);
    console.log(solInfo.data);
    return solInfo.data;
}

async function getSolanaWallet(){
    //Create a Uint8Array from process.env.SOLANA_ACCOUNT_SECRET_KEY
    const secretKey = new Uint8Array(process.env.SOLANA_ACCOUNT_SECRET_KEY.split(','));

    const keypair = Keypair.fromSecretKey(secretKey);

    return keypair;
}
