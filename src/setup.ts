require('dotenv').config();
import { Keypair } from "@solana/web3.js";
import { Wallet } from '@project-serum/anchor';
import { default as axios } from 'axios';
const NUMBER_OF_BUY_ORDERS_TO_CREATE_INITIALLY = 10;
const NUMBER_OF_SELL_ORDERS_TO_CREATE_INITIALLY = 1;


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
    for(let i = 1; i <= NUMBER_OF_BUY_ORDERS_TO_CREATE_INITIALLY; i++){
        console.log("Creating buy order no. ", i);
        let buyOrder:number = initialPrice - ((variation*i) * initialPrice);
        buyOrder = +buyOrder.toFixed(4);
        console.log("Buy order equals : ", buyOrder);
        buyOrders.push(buyOrder);
    }
    for(let i = 1; i <= NUMBER_OF_SELL_ORDERS_TO_CREATE_INITIALLY; i++){
        console.log("Creating sell order no. ", i);
        let sellOrder:number = initialPrice + ((variation*i) * initialPrice);
        sellOrder = +sellOrder.toFixed(4);
        console.log("Sell order equals : ", sellOrder);
        sellOrders.push(sellOrder);
    }
    return {buyOrders, sellOrders};
}

export async function getSolInitialInfo() {
    try { 
        const solInfo = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`);
        console.log("Solana initial Info : ", solInfo.data);
        return solInfo.data;
    }
    catch (error) {
        console.log(error);
    }
}

export async function getSolOfficialPrice(){
    try {
        const solPrice = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`);
        return solPrice.data.solana.usd;
    }
    catch (error) {
        console.log(error);
    }
}

export async function getSolanaWallet(){
    //Create a Uint8Array from process.env.SOLANA_ACCOUNT_SECRET_KEY
    let secretKeyJSON = process.env.SOLANA_ACCOUNT_SECRET_KEY.split(',');
    let secretKeyJSONToNumber = secretKeyJSON.map(str => {
        return Number(str);
      });

    let secretKey = new Uint8Array(secretKeyJSONToNumber);
    const keypair = Keypair.fromSecretKey(secretKey);

    const wallet = new Wallet(keypair);
    console.log("Solana Wallet : ", wallet);

    return wallet;
}
