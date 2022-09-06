import { Wallet } from '@project-serum/anchor';
import { Connection, Transaction } from '@solana/web3.js';
import { getAmountOfUSDCToSell } from './getTokens';
import { getSolanaPriceAndBestRouteToBuySol, getSolanaPriceAndBestRouteToSellSol, getSolanaPriceFor1SOL, calculateProfit } from './prices';
import { setup } from './setup';
import fetch from 'cross-fetch'
const express = require('express');
const port = 3000;
const variation: number = +process.env.DECIMAL_VARIATION;
const solana = new Connection(process.env.SOLANA_RPC_URL, {
    commitment: 'finalized',
    wsEndpoint: process.env.SOLANA_WS_ENDPOINT,
});
var numberOfSells = 0;
var numberOfBuys = 0;
var amountOfSolToSell = 0;
var amountOfUSDCToSell = 0;
var positionTaken:number[] = [];

const app = express();
app.listen(port, () => console.log(`App listening on port ${port}!`));
launch();

export async function launch() {
    const { solanaWallet, orders } = await setup();
    console.log("Solana wallet:", solanaWallet.publicKey.toString());
    amountOfSolToSell = 0;
    amountOfUSDCToSell = await getAmountOfUSDCToSell(solanaWallet, solana);
    console.log("Amount of sol to sell:", amountOfSolToSell);
    console.log("Amount of USDC to sell:", amountOfUSDCToSell);

    var buyOrders = orders.buyOrders;
    var sellOrders = orders.sellOrders;

    // Create a function that loop itself when it is finished
    while (true) {
        // Get the actual price of 1 SOL vs USDC
        var solanaPrice = await getSolanaPriceFor1SOL();
        console.log("price: " + solanaPrice);

        // If the price is equals or below the lowest buy order inside the array, buy the coin
        if (solanaPrice <= buyOrders[0]) {
            const [price, bestRoute] = await getSolanaPriceAndBestRouteToBuySol(amountOfUSDCToSell);
            if(amountOfUSDCToSell > 0){
                console.log("Using " + amountOfUSDCToSell + " USDC to buy " + price + " SOL");
                let success = await buySolana(bestRoute, solanaWallet);
                if(!success) {
                    console.log("Failed to buy solana");
                }
                else {
                    // Delete the buy Order executed
                    buyOrders.splice(0, 1);
                    // Update the sell orders array with a new sell order at the start of the array
                    sellOrders.unshift(solanaPrice + ((variation) * solanaPrice));
                    // Sort the sellOrders in ascending orders
                    sellOrders.sort(function(a, b){return a-b});
                    console.log("Sell orders updated :", sellOrders);
                    // Update the positionTaken array with the new position
                    positionTaken.unshift(solanaPrice);
                    console.log("Position taken updated :", positionTaken);
                    // Update the amount of SOL to sell for next order
                    amountOfSolToSell = price;
                }
            }
        }

        // If the price is equals or above the lowest sell order, sell the coin
        if (solanaPrice >= sellOrders[0]) {
            if(amountOfSolToSell > 0 && positionTaken.length !== 0){
                const [price, bestRoute] = await getSolanaPriceAndBestRouteToSellSol(amountOfSolToSell);
                console.log("Using " + amountOfSolToSell + " SOL to buy " + price + " USDC");
                let success:boolean = await sellSolana(bestRoute, solanaWallet);
                if(!success) {
                    console.log("Failed to sell solana");
                }
                else {
                    // Calculate the profit of the sell order
                    var profit = await calculateProfit(positionTaken[0], solanaPrice, amountOfSolToSell);
                    console.log("Profit from this sell order (without fees) is:", profit);
                    positionTaken.splice(0, 1);
                    // Delete the sell order executed
                    sellOrders.splice(0, 1);
                    // Update the buy orders array with a new buy order at the start of the array
                    buyOrders.unshift(solanaPrice - ((variation) * solanaPrice));
                    // Sort the buyOrders in descending order
                    buyOrders.sort(function (a, b) { return b - a });
                    console.log("buyOrders updated are :", buyOrders);
                }
            }
        }

        await sleep(1000);
    }
}

async function buySolana(route: any[], wallet:Wallet): Promise<boolean> {
    numberOfBuys++;
    console.log("Number of buys:", numberOfBuys);

    // Make the buy order
    let transactions = await createTransactions(route, wallet);
    let setupTransaction, swapTransaction, cleanupTransaction;
    if(transactions.setupTransaction !== undefined){    setupTransaction = transactions.setupTransaction;    }
    if(transactions.swapTransaction !== undefined){    swapTransaction = transactions.swapTransaction;    }
    if(transactions.cleanupTransaction !== undefined){    cleanupTransaction = transactions.cleanupTransaction;    }

    console.log("Transaction for buying : ");
    console.log("setupTransaction:", setupTransaction);
    console.log("swapTransaction:", swapTransaction);
    console.log("cleanupTransaction:", cleanupTransaction);

    try {
        await executeTransactions(setupTransaction, swapTransaction, cleanupTransaction, wallet);
    }
    catch (error) {
        console.log("Error while buying SOL", error);
        return false;
    }

    // Update the amount of USDC to use for next order
    amountOfUSDCToSell = await getAmountOfUSDCToSell(wallet, solana);
    console.log("Amount of USDC to sell updated is :", amountOfUSDCToSell);

    return true;
}

async function sellSolana(route: any[], wallet:Wallet): Promise<boolean> {
    numberOfSells++;
    console.log("Number of sells:", numberOfSells);

    // Make the sell order
    var transactions = await createTransactions(route, wallet);
    var setupTransaction, swapTransaction, cleanupTransaction;
    if(transactions.setupTransaction !== undefined){    setupTransaction = transactions.setupTransaction;    }
    if(transactions.swapTransaction !== undefined){    swapTransaction = transactions.swapTransaction;    }
    if(transactions.cleanupTransaction !== undefined){    cleanupTransaction = transactions.cleanupTransaction;    }

    console.log("Transaction for selling : ");
    console.log("setupTransaction:", setupTransaction);
    console.log("swapTransaction:", swapTransaction);
    console.log("cleanupTransaction:", cleanupTransaction);

    try {
        await executeTransactions(setupTransaction, swapTransaction, cleanupTransaction, wallet);
    }
    catch (error) {
        console.log("Error while selling SOL :", error);
        return false;
    }

    return true;
}

async function createTransactions(route: any[], wallet:Wallet) {
    // get serialized transactions for the swap
    const transactions = await (
    await fetch('https://quote-api.jup.ag/v1/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // route from /quote api
        route: route,
        // user public key to be used for the swap
        userPublicKey: wallet.publicKey.toString(),
        // auto wrap and unwrap SOL. default is true
        wrapUnwrapSOL: false 
      })
    })
  ).json();

    return transactions;
}

async function executeTransactions (setupTransaction:string, swapTransaction: string, cleanupTransaction: string, wallet:Wallet): Promise<any> {
    for(let serializedTransaction of [setupTransaction, swapTransaction, cleanupTransaction].filter(Boolean)){
        // get transaction object from serialized transaction
        const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'));
        let latestBlockHash = await solana.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockHash.blockhash;
        transaction.feePayer = wallet.publicKey;
        transaction.lastValidBlockHeight = latestBlockHash.lastValidBlockHeight;
        console.log("serializedTransaction:", serializedTransaction);
        console.log("transaction:", transaction);
        const txid = await solana.sendTransaction(transaction, [wallet.payer], {
            skipPreflight: true
        });
        console.log("Waiting for solana to confirm transaction:", txid);
        await solana.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: txid,
        });
        // Make sure the transaction is confirmed and not failed 
        const confirmedTransaction = await solana.getTransaction(txid);
        if(confirmedTransaction == null || confirmedTransaction.meta !== null || confirmedTransaction.meta.err !== null){
            console.log("Transaction failed");
            console.log("confirmedTransaction.meta.err:", confirmedTransaction.meta.err);
            throw new Error("Transaction failed with error: " + confirmedTransaction.meta.err);
        }
        console.log(`https://solscan.io/tx/${txid}`);
        if(confirmedTransaction !== null){
            console.log("confirmedTransaction:", confirmedTransaction);
            return confirmedTransaction;
        }
        return null;
    }
}

// Create sleep function
export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

