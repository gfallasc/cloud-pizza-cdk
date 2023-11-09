type OrderPizzaRequest = {
    flavour: string;
    address: string;
}

exports.handler = async function ({ flavour, address }: OrderPizzaRequest) {
    console.log(`Requested Pizza: ${flavour} to deliver to: ${address}`);

    let containsPineapple = false;

    if (flavour == 'pineapple' || flavour == 'hawaiian') {
        containsPineapple = true;
    }

    return {
        containsPineapple,
    };
}



