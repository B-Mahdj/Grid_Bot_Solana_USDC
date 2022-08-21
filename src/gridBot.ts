import { setup } from './setup';
const variation: number = +process.env.DECIMAL_VARIATION;

launch();

export async function launch() {
    const { solanaWallet, orders } = await setup();
    var buyOrders = orders.buyOrders;
    var sellOrders = orders.sellOrders;

    // Create a function that loop itself when it is finished
    while (true) {
        // Get the actual price of the Solana coin 
        const price = await getSolanaPrice();

        // If the price is equals or below the lowest buy order inside the array, buy the coin
        if (price <= buyOrders[0]) {
            await buySolana(price);
            buyOrders.splice(0, 1);
            // Update the sell orders array with a new sell order at the start of the array
            sellOrders.unshift(price + ((variation) * price));
            // Sort the sellOrders in ascending order
            sellOrders.sort((a, b) => a - b);
        }

        // If the price is equals or above the lowest sell order, sell the coin

        if (price >= sellOrders[0]) {
            await sellSolana(price);
            sellOrders.splice(0, 1);
            // Update the buy orders array with a new buy order at the start of the array
            buyOrders.unshift(price - ((variation) * price));
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

async function getSolanaPrice(): Promise<number> {
    throw new Error('Function not implemented.');
}


async function buySolana(price: number): Promise<void> {
    throw new Error('Function not implemented.');
}


async function sellSolana(price: number): Promise<void> {
    throw new Error('Function not implemented.');
}
