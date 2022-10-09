import { Wallet } from '@project-serum/anchor';
import { BlockhashWithExpiryBlockHeight, Connection, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { getAmountOfUSDCToSell } from './getTokens';
import { getSolanaPriceAndBestRouteToBuySol, getSolanaPriceAndBestRouteToSellSol, getSolanaPriceFor1SOL, calculateProfit } from './getPrices';
import { setup, getSolInitialInfo, getSolOfficialPrice } from './setup';
import fetch from 'cross-fetch';
const express = require('express');
const port = 3000;
const variation: number = +process.env.DECIMAL_VARIATION;
const solana = new Connection(process.env.SOLANA_RPC_URL, {
    commitment: 'finalized',
    wsEndpoint: process.env.SOLANA_WS_ENDPOINT,
});
let numberOfSells = 0;
let numberOfBuys = 0;
let amountOfSolToSell: number[] = [];
let amountOfUSDCToSell = 0;
let positionTaken: number[] = [];
let buyOrders: number[] = [];
let sellOrders: number[] = [];
let solanaWallet:Wallet;
let totalProfit = 0;

const app = express();
app.listen(port, () => console.log(`App listening on port ${port}!`));
launch();

export async function launch() {
    try {
        let setupResult = await setup();
        solanaWallet = setupResult.solanaWallet;
        let orders = setupResult.orders;
        console.log("Solana wallet:", solanaWallet.publicKey.toString());
        amountOfUSDCToSell = await getAmountOfUSDCToSell(solanaWallet, solana);
        console.log("Amount of sol to sell:", amountOfSolToSell);
        console.log("Amount of USDC to sell:", amountOfUSDCToSell);
    
        buyOrders = orders.buyOrders;
        sellOrders = orders.sellOrders;
    
        // Every 1 hour : print the price 
        setInterval(async function () {
            console.log("Price of 1 SOL:", +(await getSolanaPriceFor1SOL()).toFixed(4));
        }, 3600000);
        //Every 30 minutes, update the amount of USDC to sell
        setInterval(async function () {
            amountOfUSDCToSell = await getAmountOfUSDCToSell(solanaWallet, solana);
            console.log("Amount of USDC to sell updated is :", amountOfUSDCToSell);
        }, 1800000);
    
        let solanaInitialInfo = await getSolInitialInfo();
        if (+solanaInitialInfo.solana.usd_24h_change < 0) {
            console.log("Solana is going down, let's buy some!");
            await buyAction(+(await getSolanaPriceFor1SOL()).toFixed(4), buyOrders, sellOrders, solanaWallet);
        }

        // Every 30 minutes, check if we need to sell everything
        setInterval(async function () {
            if(await stopLossCheck(positionTaken)){
                console.log("Stop loss reached, let's sell!");
                for(let i = 0; i < positionTaken.length; i++){
                    await sellAction(+(await getSolOfficialPrice()).toFixed(4), buyOrders, sellOrders, solanaWallet);
                }
            }
        }, 1800000);

        await sleep(1000);

    }
    catch (e) {
        console.log("Error in launch");
        console.log(e);
    }

    while (true) {
        await loopAction();
    }
}

async function loopAction(){
    try {
        // Get the actual price of 1 SOL vs USDC
        let solanaPrice = +(await getSolanaPriceFor1SOL()).toFixed(4);

        // If the price is equals or below the lowest buy order inside the array, buy the coin
        if (solanaPrice <= buyOrders[0]) {
            await buyAction(solanaPrice, buyOrders, sellOrders, solanaWallet);
        }

        // If the price is equals or above the lowest sell order, sell the coin
        if (solanaPrice >= sellOrders[0]) {
            await sellAction(solanaPrice, buyOrders, sellOrders, solanaWallet);
        }
    }
    catch (e) {
        console.log("Error in loopAction");
        console.log(e);
    }
}

async function stopLossCheck(positionTaken:number[]): Promise<boolean>{
    let solanaOfficialPrice = +(await getSolOfficialPrice()).toFixed(4);
    if(positionTaken.length > 0 && positionTaken[0] !== undefined){
        let stopLossPrice = positionTaken[0] - (positionTaken[0] * +process.env.STOP_LOSS_PERCENTAGE);
        console.log("Stop loss price:", stopLossPrice);
        if(solanaOfficialPrice <= stopLossPrice){
            return true;
        }
    }
    return false;
}

async function buyAction(solanaPrice: number, buyOrders: number[], sellOrders: number[], solanaWallet: Wallet): Promise<void> {
    if (amountOfUSDCToSell > 0) {
        console.log("Price, " + solanaPrice + " is lower than the lowest buy order, " + buyOrders[0]);
        const [price, bestRoute] = await getSolanaPriceAndBestRouteToBuySol(amountOfUSDCToSell);
        console.log("Using " + amountOfUSDCToSell + " USDC to buy " + price + " SOL");
        let success = await buySolana(bestRoute, solanaWallet);
        if (!success) {
            console.log("Failed to buy solana");
        }
        else {
            // Delete the buy Order executed
            buyOrders.splice(0, 1);
            console.log("Buy order updated:", buyOrders);
            // Update the sell orders array with a new sell order at the start of the array
            sellOrders.unshift(+((solanaPrice + ((variation) * solanaPrice)).toFixed(4)));
            // Sort the sellOrders in ascending orders
            sellOrders.sort(function (a, b) { return a - b });
            console.log("Sell orders updated :", sellOrders);
            // Update the positionTaken array with the new position
            positionTaken.unshift(solanaPrice);
            console.log("Position taken updated :", positionTaken);
            // Update the amount of SOL to sell for next order
            amountOfSolToSell.unshift(price);
            console.log("Amount of sol to sell updated :", amountOfSolToSell);
            // Update the amount of USDC to use for next order
            amountOfUSDCToSell = await getAmountOfUSDCToSell(solanaWallet, solana);
            console.log("Amount of USDC to sell updated is :", amountOfUSDCToSell);
        }
    }
}

async function sellAction(solanaPrice: number, buyOrders: number[], sellOrders: number[], solanaWallet: Wallet): Promise<void> {
    if (amountOfSolToSell.length != 0 && amountOfSolToSell[0] > 0 && positionTaken.length !== 0) {
        console.log("Price, " + solanaPrice + " is higher than the lowest sell order, " + sellOrders[0]);
        const [price, bestRoute] = await getSolanaPriceAndBestRouteToSellSol(amountOfSolToSell[0]);
        console.log("Using " + amountOfSolToSell[0] + " SOL to buy " + price + " USDC");
        let success: boolean = await sellSolana(bestRoute, solanaWallet);
        if (!success) {
            console.log("Failed to sell solana");
        }
        else {
            // Calculate the profit of the sell order
            let profit = await calculateProfit(positionTaken[0], solanaPrice, amountOfSolToSell[0]);
            totalProfit += profit;
            console.log("Profit from this sell order (without fees) is:", profit);
            console.log("Total profit is:", totalProfit);
            positionTaken.splice(0, 1);
            console.log("Position taken updated :", positionTaken);
            // Delete the sell order executed
            sellOrders.splice(0, 1);
            console.log("Sell orders updated :", sellOrders);
            // Update the buy orders array with a new buy order at the start of the array
            buyOrders.unshift(+((solanaPrice - ((variation) * solanaPrice)).toFixed(4)));
            // Sort the buyOrders in descending order
            buyOrders.sort(function (a, b) { return b - a });
            console.log("buyOrders updated are :", buyOrders);
            // Update the amount of SOL to sell for next order
            amountOfSolToSell.splice(0, 1);
            console.log("Amount of sol to sell:", amountOfSolToSell);
            // Update the amount of USDC to use for next order
            amountOfUSDCToSell = await getAmountOfUSDCToSell(solanaWallet, solana);
            console.log("Amount of USDC to sell:", amountOfUSDCToSell);
        }
    }
}

async function buySolana(route: any[], wallet: Wallet): Promise<boolean> {
    // Make the buy order
    let transactions = await createTransactions(route, wallet);
    let swapTransaction;
    if (transactions.swapTransaction !== undefined) { swapTransaction = transactions.swapTransaction; }

    console.log("swapTransaction:", swapTransaction);

    try {
        let success: boolean = await executeTransactions(swapTransaction, wallet);
        if (success) {
            numberOfBuys++;
            console.log("Number of buys:", numberOfBuys);
        }
        return success;
    }
    catch (error) {
        console.log("Error while buying SOL", error);
        return false;
    }
}

async function sellSolana(route: any[], wallet: Wallet): Promise<boolean> {
    // Make the sell order
    let transactions = await createTransactions(route, wallet);
    let swapTransaction;
    if (transactions.swapTransaction !== undefined) { swapTransaction = transactions.swapTransaction; }

    console.log("swapTransaction:", swapTransaction);

    try {
        let success: boolean = await executeTransactions(swapTransaction, wallet);
        if (success) {
            numberOfSells++;
            console.log("Number of sells:", numberOfSells);
        }
        return success;
    }
    catch (error) {
        console.log("Error while selling SOL :", error);
        return false;
    }
}

async function createTransactions(route: any[], wallet: Wallet) {
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

async function executeTransactions(swapTransaction: string, wallet: Wallet): Promise<boolean> {
    for (let serializedTransaction of [swapTransaction].filter(Boolean)) {
        // get transaction object from serialized transaction
        const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'));
        let latestBlockHash = await solana.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockHash.blockhash;
        transaction.feePayer = wallet.publicKey;
        transaction.lastValidBlockHeight = latestBlockHash.lastValidBlockHeight;
        console.log("Transaction created");
        const txid = await sendAndConfirmTransaction(solana, transaction, [wallet.payer]);
        console.log("txid:", txid);
        // MAYBE TO DELETE :
        console.log("Waiting for solana to confirm transaction:", txid);
        return waitForConfirmation(txid, latestBlockHash);
    }
}

async function waitForConfirmation(txid: string, latestBlockHash: BlockhashWithExpiryBlockHeight): Promise<boolean> {
    let resultOfConfirmation = await solana.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid,
    });
    console.log("Result of confirmation:", resultOfConfirmation);
    console.log("Result of confirmation signature result: ", resultOfConfirmation.value);

    // Make sure the transaction is not failed
    if (resultOfConfirmation.value.err != null) {
        console.log("Transaction failed with erros:", resultOfConfirmation.value.err);
        return false;
    }
    else {
        console.log("confirmedTransaction:", resultOfConfirmation);
        console.log(`https://solscan.io/tx/${txid}`);
        return true;
    }
}

// Create sleep function
export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

