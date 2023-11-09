type DeliverPizzaRequest = {
    flavour: string;
    address: string;
    testFailDeliver?: boolean;
}

/**
 * Helper function to get the 
 * @param address 
 * @returns 
 */
function getEstimateDeliveryTime(address: string) {
    if (address === 'Near to restaurant') { 
        return '15 to 20 minutes';
    } else {
        return '25 to 35 minutes';
    }
}

/**
 * Simulates waiting 3 seconds to start the delivery process
 * @returns 
 */
function simulateDeliverStartTime() {
    return new Promise((resolve) => setTimeout(resolve, 3000));
}

/**
 * 
 * For testing purposes it fails it the address is equal to "Not a real street"
 */
exports.handler = async function ({ flavour, address, testFailDeliver }: DeliverPizzaRequest) {
    // This would be likely an async call to a service to get an estimation delivery time
    const estimateDuration = getEstimateDeliveryTime(address);

    if (testFailDeliver) {
        throw new Error("Failed to deliver pizza");
    }

    console.log(`Start devilery for pizza: ${flavour} to: ${address}, pizza will be delivered in ${estimateDuration}`);
    await simulateDeliverStartTime();

    return {
        status: 'Delivering',
        estimateDuration
    }
}



