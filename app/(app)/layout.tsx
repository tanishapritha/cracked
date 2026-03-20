import { Nav } from "@/components/nav";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Nav />
      <main className="pt-14">{children}</main>
    </div>
  );
}
