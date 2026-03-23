import { Nav } from "@/components/nav";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <Nav />
      <main className="pt-14 relative z-0">{children}</main>
    </div>
  );
}
