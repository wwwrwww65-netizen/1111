import React from 'react';
import renderer from 'react-test-renderer';
import HomeScreen from '../src/screens/HomeScreen';

// Mock trpc
jest.mock('../src/lib/trpc', () => ({
  trpc: {
    products: {
      listCategories: {
        useQuery: jest.fn(() => ({ data: { items: [] }, isLoading: false, error: null })),
      },
      list: {
        useQuery: jest.fn(() => ({ data: { items: [] }, isLoading: false, error: null })),
      },
    },
  },
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

it('renders correctly', () => {
  const tree = renderer.create(<HomeScreen />).toJSON();
  expect(tree).toMatchSnapshot();
});
