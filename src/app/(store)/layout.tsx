import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="pt-16 md:pt-20">{children}</div>
      <Footer />
    </>
  );
}
