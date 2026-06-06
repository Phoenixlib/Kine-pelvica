import { Navbar } from "~/components/Navbar";
import { Footer } from "~/components/Footer";
import { auth } from "~/server/auth";
import { sanityClient } from "~/lib/sanity";
import Link from "next/link";
import { ChevronRight, Calendar as CalendarIcon } from "lucide-react";

export const dynamic = "force-dynamic";

interface Post {
  _id: string;
  title: string;
  slug: string;
  image: string;
  category: string;
  description: string;
  publishedAt: string;
}

const fallbackPosts: Post[] = [
  {
    _id: "fb-1",
    slug: "cicatriz-hipertrofica-o-queloide",
    image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "CONSEJOS",
    title: "Mi cicatriz: ¿Es hipertrófica o queloide?",
    description: "Aprende a diferenciar el tipo de cicatrización y conoce las opciones de tratamiento disponibles para mejorar su aspecto y funcionalidad.",
    publishedAt: "2026-06-01T12:00:00Z",
  },
  {
    _id: "fb-2",
    slug: "cesarea-recuperacion-postparto",
    image: "https://images.unsplash.com/photo-1606240212788-b2170cbae985?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "MATERNIDAD",
    title: "La cesárea no es el camino fácil: tips y recomendaciones",
    description: "El proceso de recuperación post-cesárea requiere cuidados específicos. Te entregamos información valiosa para una recuperación óptima.",
    publishedAt: "2026-05-28T12:00:00Z",
  }
];

async function getBlogPosts(): Promise<Post[] | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "placeholder") {
      return null;
    }
    const data = await sanityClient.fetch<Post[]>(`
      *[_type == "post"] | order(publishedAt desc) {
        _id,
        title,
        "slug": slug.current,
        "image": mainImage.asset->url,
        "category": category->title,
        description,
        publishedAt
      }
    `);
    return data && data.length > 0 ? data : null;
  } catch (error) {
    console.error("Error fetching blog posts from Sanity, using fallback:", error);
    return null;
  }
}

export default async function BlogPage() {
  const session = await auth();
  const dbPosts = await getBlogPosts();
  const posts = dbPosts || fallbackPosts;

  return (
    <>
      <Navbar isAdmin={!!session?.user} />
      
      <main className="min-h-screen bg-offwhite pt-32 pb-24">
        {/* Header Hero */}
        <section className="py-12 md:py-20 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-redbrown uppercase mb-4">
            Blog & Divulgación
          </h1>
          <h2 className="font-title text-4xl md:text-5xl text-teal mb-6">
            Espacio de <span className="italic font-light text-terracotta">Bienestar</span> Pélvico
          </h2>
          <p className="font-body text-base md:text-lg text-teal/80 leading-relaxed max-w-2xl mx-auto">
            Artículos, consejos e información científica sobre kinesiología pélvica, salud femenina y bienestar integral para acompañar cada etapa de tu vida.
          </p>
        </section>

        {/* Grid de Artículos */}
        <section className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => {
              const formattedDate = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : null;

              return (
                <Link 
                  href={`/blog/${post.slug}`}
                  key={post._id} 
                  className="group cursor-pointer flex flex-col bg-white border border-cream/50 rounded-3xl shadow-xs hover:shadow-xl hover:border-teal/20 transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-video w-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-teal/10 group-hover:bg-transparent transition-colors z-10"></div>
                    {post.image ? (
                      <img 
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#0f3f3e]/10 flex items-center justify-center text-teal/30 font-subtitle font-bold uppercase tracking-wider text-xs">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-subtitle font-bold text-dustypink">
                        {post.category || "General"}
                      </span>
                      {formattedDate && (
                        <span className="text-[10px] text-teal/55 flex items-center gap-1">
                          <CalendarIcon size={12} />
                          {formattedDate}
                        </span>
                      )}
                    </div>
                    <h3 className="font-title text-xl text-teal group-hover:text-redbrown transition-colors leading-[1.3] mb-3">
                      {post.title}
                    </h3>
                    <p className="font-body text-sm text-teal/70 mb-6 flex-1 line-clamp-3 leading-relaxed">
                      {post.description}
                    </p>
                    <span className="font-subtitle text-[10px] font-bold uppercase tracking-widest text-terracotta flex items-center mt-auto">
                      Leer artículo <ChevronRight size={12} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
