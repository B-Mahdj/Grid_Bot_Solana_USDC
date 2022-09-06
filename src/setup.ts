require('dotenv').config();
import { Keypair } from "@solana/web3.js";
import { Wallet } from '@project-serum/anchor';
import { default as axios } from 'axios';
const NUMBER_OF_ORDERS_TO_CREATE = 5;

export async function setup(){
    const solanaWallet = await getSolanaWallet();

    const orders = await createInitialBuyAndSellOrders();
    console.log("Buy Orders : ", orders.buyOrders);
    console.log("Sell Orders : ", orders.sellOrders);
    
    return {solanaWallet, orders};
}

async function createInitialBuyAndSellOrders(){
    // Get the Solana initial price & variation wanted
    const solanaInfo = await getSolInitialInfo();
    const initialPrice = solanaInfo.solana.usd;
    const variation:number = +process.env.DECIMAL_VARIATION;

    const buyOrders = [];
    const sellOrders = [];
    console.log("Creating orders...");
    for(let i = 1; i <= NUMBER_OF_ORDERS_TO_CREATE; i++){
        console.log("Creating buy order no. ", i);
        console.log("Buy order equals : ", initialPrice - ((variation*i) * initialPrice));
        let buyOrder:number = initialPrice - ((variation*i) * initialPrice);
        buyOrders.push(buyOrder);
    }
    for(let i = 1; i <= NUMBER_OF_ORDERS_TO_CREATE; i++){
        console.log("Creating sell order no. ", i);
        console.log("Sell order equals : ", initialPrice + ((variation*i) * initialPrice));
        let sellOrder = initialPrice + ((variation*i) * initialPrice);
        sellOrders.push(sellOrder);
    }
    return {buyOrders, sellOrders};
}

async function getSolInitialInfo() {
    try { 
        const solInfo = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`);
        console.log("Solana initial Info : ", solInfo.data);
        return solInfo.data;
    }
    catch (error) {
        console.log(error);
    }
}

async function getSolanaWallet(){
    //Create a Uint8Array from process.env.SOLANA_ACCOUNT_SECRET_KEY
    var secretKeyJSON = process.env.SOLANA_ACCOUNT_SECRET_KEY.split(',');
    var secretKeyJSONToNumber = secretKeyJSON.map(str => {
        return Number(str);
      });

    var secretKey = new Uint8Array(secretKeyJSONToNumber);
    const keypair = Keypair.fromSecretKey(secretKey);

    const wallet = new Wallet(keypair);
    console.log("Solana Wallet : ", wallet);

    return wallet;
}
