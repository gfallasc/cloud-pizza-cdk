import { handler } from './../lambda/orderPizza'; // Replace with the correct path

describe('Order Pizza Lambda Handler', () => {
  // Test for invalid flavour
  it('should detect pineapple flavour', async () => {
    const result = await handler({ flavour: 'pineapple', address: 'Address' });
    expect(result.containsPineapple).toBe(true);
  });

  // Test for a valid flavour
  it('should not detect pineapple for valid pizza flavours', async () => {
    const result = await handler({ flavour: 'pepperoni', address: 'Address' });
    expect(result.containsPineapple).toBe(false);
  });

  // Test for invalid address
  it('should validate empty address', async () => {
    const result = await handler({ flavour: 'margherita', address: '' });
    expect(result.addressDeliverable).toBe(false);
  });


  // Test for valid address
  it('should mark address as deliverable for valid address', async () => {
    const result = await handler({ flavour: 'margherita', address: 'Address' });
    expect(result.addressDeliverable).toBe(true);
  });
});
