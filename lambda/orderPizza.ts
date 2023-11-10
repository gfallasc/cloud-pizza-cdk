type OrderPizzaRequest = {
    flavour: string;
    address: string;
}

export async function handler({ flavour, address }: OrderPizzaRequest) {
    console.log(`Requested Pizza: ${flavour} to deliver to: ${address}`);

    let containsPineapple = false;
    let addressDeliverable = false;

    if (flavour == 'pineapple' || flavour == 'hawaiian') {
        containsPineapple = true;
    }

    if (address && address.trim() !== '') {
        addressDeliverable = true;
    }
    return {
        containsPineapple,
        addressDeliverable
    };
}



