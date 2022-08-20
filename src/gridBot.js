require('dotenv').config();
const {Keypair} = require("@solana/web3.js");
const { Wallet } = require('@project-serum/anchor');

const { default: axios } = require('axios');

launch();

async function launch(){
    // Step 1 : Connect to the Solana Wallet 
    const wallet = await getSolanaWallet();

    // Step 2 : Get the Solana price info & Initial price
    const solanaInfo = await getSolInitialInfo();
    console.log("Solana initial Info : ", solanaInfo);
    const solanaInitialPrice = solanaInfo.solana.usd;

    // Step 3 : Create the buy and sell orders

    const orders = await createBuyAndSellOrders(solanaInitialPrice, process.env.DECIMAL_VARIATION);
    console.log("Buy Orders : ", orders.buyOrders);
    console.log("Sell Orders : ", orders.sellOrders);
    
    // Step 4 : Every second , launch the 


}

async function createBuyAndSellOrders(initialPrice, variation){
    const buyOrders = [];
    const sellOrders = [];
    for(let i = 1; i <= 20; i++){
        let buyOrder = initialPrice - ((variation*i) * initialPrice);
        buyOrder = buyOrder.toFixed(2);
        buyOrders.push(buyOrder);
    }
    for(let i = 1; i <= 20; i++){
        let sellOrder = initialPrice + ((variation*i) * initialPrice);
        sellOrder = sellOrder.toFixed(2);
        sellOrders.push(sellOrder);
    }
    return {buyOrders, sellOrders};
}


async function getSolInitialInfo() {
    const solInfo = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`);
    return solInfo.data;
}

async function getSolanaWallet(){
    //Create a Uint8Array from process.env.SOLANA_ACCOUNT_SECRET_KEY
    const secretKey = new Uint8Array(process.env.SOLANA_ACCOUNT_SECRET_KEY.split(','));
    const keypair = Keypair.fromSecretKey(secretKey);

    const wallet = new Wallet(keypair);
    console.log("Solana Wallet : ", wallet);

    return wallet;
}
