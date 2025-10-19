import React from 'react';
import renderer from 'react-test-renderer';
import CartScreen from '../src/screens/CartScreen';

// Mock trpc
jest.mock('../src/lib/trpc', () => ({
  trpc: {
    cart: {
      get: {
        useQuery: jest.fn(() => ({ data: { items: [] }, isLoading: false, error: null })),
      },
    },
  },
}));

it('renders correctly', () => {
  const tree = renderer.create(<CartScreen />).toJSON();
  expect(tree).toMatchSnapshot();
});
