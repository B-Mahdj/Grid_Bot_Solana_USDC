import { sleep } from "./gridBot";

export async function manage_axios_error(error:any) {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        //If 429 error, wait 10 second and try again
        if (error.response.status === 429) {
            console.log('429 error, waiting 10 seconds and trying again');
            await sleep(10000);
            return;
        }
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
    }
}