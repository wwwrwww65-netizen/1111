import { redirect } from 'next/navigation';

export default function AdminHome(): JSX.Element {
  redirect('/products');
}