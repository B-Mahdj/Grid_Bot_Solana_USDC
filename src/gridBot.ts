import { Connection } from '@solana/web3.js';
import { getAmountSolToSell, getAmountOfUSDCToSell } from './getTokens';
import { getSolanaPriceAndBestRouteToBuySol, getSolanaPriceAndBestRouteToSellSol, getSolanaPriceFor1SOL } from './prices';
import { setup } from './setup';
const express = require('express');
const port = 3000;
const variation: number = +process.env.DECIMAL_VARIATION;
const solana = new Connection(process.env.SOLANA_RPC_URL);
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
            console.log("Buying solana at price", solanaPrice);
            const [price, bestRoute] = await getSolanaPriceAndBestRouteToBuySol(amountOfUSDCToSell);
            console.log("Using " + amountOfUSDCToSell + " USDC to buy " + price + " SOL");
            await buySolana(bestRoute);
            buyOrders.splice(0, 1);
            // Update the sell orders array with a new sell order at the start of the array
            sellOrders.unshift(solanaPrice + ((variation) * solanaPrice));
            // Sort the sellOrders in ascending order
            sellOrders.sort((a, b) => a - b);
        }

        // If the price is equals or above the lowest sell order, sell the coin
        if (solanaPrice >= sellOrders[0]) {
            console.log("Selling solana at price", solanaPrice);
            const [price, bestRoute] = await getSolanaPriceAndBestRouteToSellSol(amountOfSolToSell);
            console.log("Using " + amountOfSolToSell + " SOL to buy " + price + " USDC");
            await sellSolana(bestRoute);
            sellOrders.splice(0, 1);
            // Update the buy orders array with a new buy order at the start of the array
            buyOrders.unshift(solanaPrice - ((variation) * solanaPrice));
            // Sort the buyOrders in ascending order
            buyOrders.sort((a, b) => a - b);
        }

        await sleep(1000);
    }
}

async function buySolana(price: any[]): Promise<void> {
    numberOfBuys++;
    console.log("Number of buys:", numberOfBuys);

    // Make the buy order

    // Update the amount of sol/ USDC to use for next order
}


async function sellSolana(price: any[]): Promise<void> {
    numberOfSells++;
    console.log("Number of sells:", numberOfSells);

    // Make the sell order

    // Update the amount of sol/ USDC to use for next order
}


// Create sleep function
export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
