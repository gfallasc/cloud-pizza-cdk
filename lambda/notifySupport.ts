/**
 * Placeholder function to notify support if an error happens during delivering or preparing pizza steps
 */
export async function handler(event: any) {
    console.log("Notify Support event:", JSON.stringify(event, undefined, 2));
    // SNS or some notification service call to email/sms the prod customer support team that something went wrong

    return {
        status: 'ok'
    };
}