import React from 'react';
import renderer from 'react-test-renderer';
import SearchScreen from '../src/screens/SearchScreen';

// Mock trpc
jest.mock('../src/lib/trpc', () => ({
  trpc: {
    search: {
      products: {
        useQuery: jest.fn(() => ({ data: { items: [] }, isLoading: false, error: null })),
      },
    },
  },
}));

it('renders correctly', () => {
  const tree = renderer.create(<SearchScreen />).toJSON();
  expect(tree).toMatchSnapshot();
});
