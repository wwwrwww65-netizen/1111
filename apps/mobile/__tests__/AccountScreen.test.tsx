import React from 'react';
import renderer from 'react-test-renderer';
import AccountScreen from '../src/screens/AccountScreen';

// Mock trpc
jest.mock('../src/lib/trpc', () => ({
  trpc: {
    auth: {
      me: {
        useQuery: jest.fn(() => ({ data: { user: { name: 'Test User' } }, isLoading: false, error: null })),
      },
    },
  },
}));

it('renders correctly', () => {
  const tree = renderer.create(<AccountScreen />).toJSON();
  expect(tree).toMatchSnapshot();
});
