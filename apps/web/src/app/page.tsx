import { Button } from "@repo/ui";

export default function Page(): JSX.Element {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-24">
      <h1 className="text-4xl font-bold mb-4">Welcome to the E-commerce Platform</h1>
      <p className="text-lg mb-8">This is the main page of the web application.</p>
      <Button onClick={() => alert("Button clicked!")}>
        Click Me
      </Button>
    </main>
  );
}
