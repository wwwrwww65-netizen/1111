export default function LegacyIndex() {
  return null;
}

export async function getServerSideProps() {
  return { redirect: { destination: '/', permanent: false } } as any;
}