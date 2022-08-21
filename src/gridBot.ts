import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import axios from 'axios';
import { setup } from './setup';
const variation: number = +process.env.DECIMAL_VARIATION;
const slippage = +process.env.SLIPPAGE;
const DECIMALS_PER_USDC = +process.env.DECIMALS_PER_USDC;
var numberOfSells = 0;
var numberOfBuys = 0;

launch();

export async function launch() {
    const { solanaWallet, orders } = await setup();
    var buyOrders = orders.buyOrders;
    var sellOrders = orders.sellOrders;

    // Create a function that loop itself when it is finished
    while (true) {
        // Get the actual price of 1 SOL vs USDC
        var [solanaPrice, bestRoute] = await getSolanaPriceAndBestRoute();
        console.log("price: " + solanaPrice);

        // If the price is equals or below the lowest buy order inside the array, buy the coin
        if (solanaPrice <= buyOrders[0]) {
            console.log("Buying solana at price", solanaPrice);
            console.log("Best route:", bestRoute);
            await buySolana(bestRoute);
            buyOrders.splice(0, 1);
            // Update the sell orders array with a new sell order at the start of the array
            sellOrders.unshift(solanaPrice + ((variation) * solanaPrice));
            // Sort the sellOrders in ascending order
            sellOrders.sort((a, b) => a - b);
        }

        // If the price is equals or above the lowest sell order, sell the coin
        if (solanaPrice >= sellOrders[0]) {
            console.log("Selling at price", solanaPrice);
            console.log("Route is:", bestRoute);
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

// Create sleep function
export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getSolanaPriceAndBestRoute(): Promise<[number, [any]]> {
    var amount = LAMPORTS_PER_SOL;
    const { data } = await (
        await axios.get(
            `https://quote-api.jup.ag/v1/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${amount}&slippage=${slippage}`
        )
    ).data;
    const routes = data;
    console.log("Best route found is:", routes[0]);
    return [(routes[0].outAmount / DECIMALS_PER_USDC), routes[0]];
}

export async function getAmountSolToUse(): Promise<number> {

}



async function buySolana(price: any[]): Promise<void> {
    numberOfSells++;
    console.log("Number of sells:", numberOfSells);
    // Get the number of SOL to use
    var amount = await getAmountSolToUse();
}


async function sellSolana(price: any[]): Promise<void> {
    numberOfBuys++;
    console.log("Number of buys:", numberOfBuys);

    // Get the number of SOL to use
    var amount = await getAmountSolToUse();
}
