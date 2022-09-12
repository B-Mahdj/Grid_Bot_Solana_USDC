import { Wallet } from '@project-serum/anchor';
import { BlockhashWithExpiryBlockHeight, Connection, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { getAmountSolToSell, getAmountOfUSDCToSell } from './getTokens';
import { getSolanaPriceAndBestRouteToBuySol, getSolanaPriceAndBestRouteToSellSol, getSolanaPriceFor1SOL } from './prices';
import { setup } from './setup';
import fetch from 'cross-fetch'
const express = require('express');
const port = 3000;
const variation: number = +process.env.DECIMAL_VARIATION;
const MAX_NUMBER_OF_TRIES = 5;
const solana = new Connection(process.env.SOLANA_RPC_URL, {
    commitment: 'finalized',
    wsEndpoint: process.env.SOLANA_WS_ENDPOINT,
});
var numberOfSells = 0;
var numberOfBuys = 0;
var amountOfSolToSell = 0;
var amountOfUSDCToSell = 0;

const app = express();
app.listen(port, () => console.log(`App listening on port ${port}!`));
launch();

export async function launch() {
    const { solanaWallet, orders } = await setup();
    console.log("Solana wallet:", solanaWallet.publicKey.toString());
    amountOfSolToSell = await getAmountSolToSell(solanaWallet, solana);
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
                var failed:boolean = await buySolana(bestRoute, solanaWallet);
                if(failed == true) {
                    console.log("Failed to buy solana");
                }
                else {
                    // Delete the buy Order executed
                    buyOrders.splice(0, 1);
                    // Update the sell orders array with a new sell order at the start of the array
                    sellOrders.unshift(solanaPrice + ((variation) * solanaPrice));
                    // Sort the sellOrders in descending orders
                    sellOrders.sort(function (a, b) { return b - a });
                    console.log("Sell orders updated :", sellOrders);
                    // Update the amount of USDC to use for next order
                    amountOfUSDCToSell = await getAmountOfUSDCToSell(solanaWallet, solana);
                    console.log("Amount of USDC to sell:", amountOfUSDCToSell);
                }
            }
        }

        // If the price is equals or above the lowest sell order, sell the coin
        if (solanaPrice >= sellOrders[0]) {
            const [price, bestRoute] = await getSolanaPriceAndBestRouteToSellSol(amountOfSolToSell);
            if(amountOfSolToSell > 0){
                console.log("Using " + amountOfSolToSell + " SOL to buy " + price + " USDC");
                var failed:boolean = await sellSolana(bestRoute, solanaWallet);
                if(failed == true) {
                    console.log("Failed to sell solana");
                }
                else {
                    // Delete the sell order executed
                    sellOrders.splice(0, 1);
                    // Update the buy orders array with a new buy order at the start of the array
                    buyOrders.unshift(solanaPrice - ((variation) * solanaPrice));
                    // Sort the buyOrders in descending order
                    buyOrders.sort(function (a, b) { return b - a });
                    console.log("buyOrders updated are :", buyOrders);
                    // Update the amount of SOL to use for next order
                    amountOfSolToSell = await getAmountSolToSell(solanaWallet, solana);
                    console.log("Amount of SOL to sell:", amountOfSolToSell);
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
    var transactions = await createTransactions(route, wallet);
    var setupTransaction, swapTransaction, cleanupTransaction;
    if(transactions.setupTransaction !== undefined){    setupTransaction = transactions.setupTransaction;    }
    if(transactions.swapTransaction !== undefined){    swapTransaction = transactions.swapTransaction;    }
    if(transactions.cleanupTransaction !== undefined){    cleanupTransaction = transactions.cleanupTransaction;    }

    console.log("Transaction for buying : ");
    console.log("setupTransaction:", setupTransaction);
    console.log("swapTransaction:", swapTransaction);
    console.log("cleanupTransaction:", cleanupTransaction);

    try {
        return await executeTransactions(setupTransaction, swapTransaction, cleanupTransaction, wallet);
    }
    catch (error) {
        console.log("Error while buying SOL", error);
        return false;
    }
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
        return await executeTransactions(setupTransaction, swapTransaction, cleanupTransaction, wallet);
    }
    catch (error) {
        console.log("Error while selling SOL :", error);
        return false;
    }
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

async function executeTransactions (setupTransaction:string, swapTransaction: string, cleanupTransaction: string, wallet:Wallet): Promise<boolean> {
    for(let serializedTransaction of [setupTransaction, swapTransaction, cleanupTransaction].filter(Boolean)){
        // get transaction object from serialized transaction
        const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'));
        var latestBlockHash = await solana.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockHash.blockhash;
        transaction.feePayer = wallet.publicKey;
        transaction.lastValidBlockHeight = latestBlockHash.lastValidBlockHeight;
        console.log("serializedTransaction:", serializedTransaction);
        console.log("transaction:", transaction);
        const txid = await sendAndConfirmTransaction(solana, transaction, [wallet.payer]);
        console.log("Waiting for solana to confirm transaction:", txid);
        return await waitForConfirmation(txid, latestBlockHash);
    }
}

async function waitForConfirmation(txid: string, latestBlockHash:BlockhashWithExpiryBlockHeight): Promise<boolean> {
    const resultOfConfirmation = await solana.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid,
    });
    console.log("Result of confirmation:", resultOfConfirmation);
    console.log("Result of confirmation signature result: ", resultOfConfirmation.value);

    // Make sure the transaction is "pushed" on the blockchain
    let transactionConfirmed = false;
    let numberOfTry = 0;
    let transaction;
    while(transactionConfirmed === false && numberOfTry < MAX_NUMBER_OF_TRIES){
        numberOfTry++;
        let transaction = await solana.getTransaction(txid);
        if(transaction == null){
            await sleep(3000);
        }
        else {
            transactionConfirmed = true;
        }
    }

    // Make sure the transaction is not failed
    if (transactionConfirmed){
        if(transaction.meta == null){
            console.log("Transaction failed", transaction);
            return false;
        }
        else if (transaction.meta.err != null){
            console.log("Transaction failed with erros:", transaction.meta.err);
            return false;
        }
        else{
            console.log("confirmedTransaction:", transaction);
            console.log(`https://solscan.io/tx/${txid}`);
            return true;
        }
    }
    else {
        return false;
    }
}

// Create sleep function
export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

