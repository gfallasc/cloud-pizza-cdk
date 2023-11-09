/**
 * Placeholder function to notify support if an error happens during delivering or preparing pizza steps
 */
exports.handler = (event: any) => {
    // SNS or some notification service call to email/sms the prod customer support team that something went wrong

    return {
        status: 'ok'
    };
}