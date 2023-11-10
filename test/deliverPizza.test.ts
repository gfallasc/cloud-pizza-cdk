import { handler } from './../lambda/deliverPizza';

describe('Deliver Pizza Lambda Handler', () => {
    // Test for successful delivery for a near address "Near to restaurant"
    it('should return a succesful deliver pizza with correct estimated time for address "Near to restaurant"', async () => {
        const result = await handler({ flavour: 'Margherita', address: 'Near to restaurant' });
        expect(result).toEqual({
            status: 'Delivering',
            estimateDuration: '15 to 20 minutes'
        });
    });

    // Test for successful delivery for a far address
    it('should return a successful deliver with different estimated time for addresses far from restaurant', async () => {
        const result = await handler({ flavour: 'Pepperoni', address: 'Street 1' });
        expect(result).toEqual({
            status: 'Delivering',
            estimateDuration: '25 to 35 minutes'
        });
    });

    // Test for delivery failure due to "testFailDeliver" flag
    it('should fail to deliver pizza when "testFailDeliver" is true for simulating a delivery failure', async () => {
        await expect(handler({ flavour: 'Pepperoni', address: 'Street 1', testFailDeliver: true }))
            .rejects.toThrow('Failed to deliver pizza');
    });
});