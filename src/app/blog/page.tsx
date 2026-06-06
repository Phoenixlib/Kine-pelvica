import { Navbar } from "~/components/Navbar";
import { Footer } from "~/components/Footer";
import { auth } from "~/server/auth";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const session = await auth();

  return (
    <>
      <Navbar isAdmin={!!session?.user} />
      
      <main className="min-h-[80vh] flex flex-col items-center justify-center bg-offwhite pt-32 pb-24 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-cream/30">
          <h1 className="font-title text-4xl md:text-5xl text-teal mb-6">
            Blog
          </h1>
          <p className="font-body text-lg text-teal/80 leading-relaxed mb-8">
            Ya lo implementaremos. Estamos trabajando para traerte el mejor contenido sobre kinesiología pélvica.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-3 bg-teal hover:bg-teal/90 text-white rounded-full font-subtitle font-bold text-[11px] tracking-widest uppercase transition-all shadow-md"
          >
            Volver al Inicio
          </a>
        </div>
      </main>

      <Footer />
    </>
  );
}
