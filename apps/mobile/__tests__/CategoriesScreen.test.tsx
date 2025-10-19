import React from 'react';
import renderer from 'react-test-renderer';
import CategoriesScreen from '../src/screens/CategoriesScreen';

// Mock trpc
jest.mock('../src/lib/trpc', () => ({
  trpc: {
    products: {
      listCategories: {
        useQuery: jest.fn(() => ({ data: { items: [] }, isLoading: false, error: null })),
      },
    },
  },
}));

it('renders correctly', () => {
  const tree = renderer.create(<CategoriesScreen />).toJSON();
  expect(tree).toMatchSnapshot();
});
