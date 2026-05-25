import { HerosPage } from "~/components/HerosPage";
import { Navbar } from "~/components/Navbar";
import { Footer } from "~/components/Footer";

export default function HerosRoute() {
  return (
    <>
      <Navbar />
      <HerosPage />
      <Footer />
    </>
  );
}
