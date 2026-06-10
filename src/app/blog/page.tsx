import { Navbar } from "~/components/Navbar";
import { Footer } from "~/components/Footer";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import Link from "next/link";
import {
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Tag,
  SlidersHorizontal,
} from "lucide-react";

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

// Fallback posts en caso de que la DB esté completamente vacía y no haya ningún filtro
const fallbackPosts: Post[] = [
  {
    _id: "fb-1",
    slug: "cicatriz-hipertrofica-o-queloide",
    image:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "CONSEJOS",
    title: "Mi cicatriz: ¿Es hipertrófica o queloide?",
    description:
      "Aprende a diferenciar el tipo de cicatrización y conoce las opciones de tratamiento disponibles para mejorar su aspecto y funcionalidad.",
    publishedAt: "2026-06-01T12:00:00Z",
  },
  {
    _id: "fb-2",
    slug: "cesarea-recuperacion-postparto",
    image:
      "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "MATERNIDAD",
    title: "La cesárea no es el camino fácil: tips y recomendaciones",
    description:
      "El proceso de recuperación post-cesárea requiere cuidados específicos. Te entregamos información valiosa para una recuperación óptima.",
    publishedAt: "2026-05-28T12:00:00Z",
  },
];

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    cat?: string;
  }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;

  const currentPage = params.page ? parseInt(params.page) || 1 : 1;
  const searchQuery = params.q?.trim() || "";
  const categorySlug = params.cat?.trim() || "";

  const limit = 9; // 9 posts por página
  const skip = (currentPage - 1) * limit;

  // Construir filtros de Prisma
  const where: any = {
    status: "PUBLISHED",
  };

  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: "insensitive" } },
      { description: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  if (categorySlug) {
    where.category = {
      slug: categorySlug,
    };
  }

  // Obtener categorías para mostrar de filtro
  const categories = await db.blogCategory.findMany({
    orderBy: { name: "asc" },
  });

  // Query posts y conteo total en paralelo
  const [postsCount, dbPosts] = await Promise.all([
    db.blogPost.count({ where }),
    db.blogPost.findMany({
      where,
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(postsCount / limit) || 1;

  let posts: Post[] = [];
  if (dbPosts.length > 0) {
    posts = dbPosts.map((p) => ({
      _id: p.id,
      title: p.title,
      slug: p.slug,
      image: p.mainImage ?? "",
      category: p.category?.name ?? "",
      description: p.description,
      publishedAt: p.publishedAt
        ? p.publishedAt.toISOString()
        : p.createdAt.toISOString(),
    }));
  } else if (!searchQuery && !categorySlug) {
    // Si no hay búsquedas ni filtros, y la DB está vacía, mostramos los fallbacks
    posts = fallbackPosts;
  }

  // Helper para construir URLs del paginado preservando búsquedas
  const getPageLink = (pageNumber: number) => {
    const urlParams = new URLSearchParams();
    if (pageNumber > 1) urlParams.set("page", pageNumber.toString());
    if (searchQuery) urlParams.set("q", searchQuery);
    if (categorySlug) urlParams.set("cat", categorySlug);
    const qs = urlParams.toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  };

  // Helper para construir URLs de la categoría preservando la búsqueda q
  const getCategoryLink = (slug: string) => {
    const urlParams = new URLSearchParams();
    if (slug) urlParams.set("cat", slug);
    if (searchQuery) urlParams.set("q", searchQuery);
    const qs = urlParams.toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <Navbar isAdmin={!!session?.user} forceSolid={true} />

      <main className="min-h-screen bg-offwhite pt-32 pb-24">
        {/* Header Hero */}
        <section className="py-8 md:py-16 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-redbrown uppercase mb-4 animate-fade-in">
            Blog & Divulgación
          </h1>
          <h2 className="font-title text-4xl md:text-5xl text-teal mb-6">
            Espacio de{" "}
            <span className="italic font-light text-terracotta">Bienestar</span>{" "}
            Pélvico
          </h2>
          <p className="font-body text-base md:text-lg text-teal/80 leading-relaxed max-w-2xl mx-auto">
            Artículos, consejos e información científica sobre kinesiología
            pélvica, salud femenina y bienestar integral para acompañar cada
            etapa de tu vida.
          </p>
        </section>

        {/* Panel de Filtros y Búsqueda */}
        <section className="container mx-auto px-4 lg:px-8 max-w-6xl mb-12">
          <div className="bg-white border border-cream/50 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Buscador */}
            <form
              method="GET"
              action="/blog"
              className="w-full md:w-96 relative flex items-center"
            >
              <Search size={18} className="absolute left-4 text-teal/40" />
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Buscar artículo..."
                className="w-full pl-11 pr-20 py-2.5 rounded-2xl border border-cream bg-offwhite/30 font-body text-sm text-teal placeholder-teal/40 focus:outline-none focus:border-[#0f3f3e] transition-colors"
              />
              {categorySlug && (
                <input type="hidden" name="cat" value={categorySlug} />
              )}
              <button
                type="submit"
                className="absolute right-2 px-3 py-1.5 bg-[#0f3f3e] hover:bg-[#1a5a58] text-white font-subtitle text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors"
              >
                Buscar
              </button>
            </form>

            {/* Selector de Categorías */}
            <div className="w-full md:w-auto flex flex-wrap items-center gap-2 justify-center md:justify-end">
              <span className="text-teal/40 font-subtitle text-[10px] uppercase font-bold tracking-wider mr-2 hidden lg:inline-flex items-center gap-1.5">
                <SlidersHorizontal size={12} />
                Filtrar:
              </span>
              <Link
                href={getCategoryLink("")}
                className={`px-3 py-1.5 rounded-xl font-subtitle text-[11px] font-bold uppercase tracking-wider transition-all ${
                  !categorySlug
                    ? "bg-[#c48a6a] text-white shadow-xs"
                    : "bg-offwhite text-teal/70 hover:bg-cream/20 hover:text-teal"
                }`}
              >
                Todos
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={getCategoryLink(cat.slug)}
                  className={`px-3 py-1.5 rounded-xl font-subtitle text-[11px] font-bold uppercase tracking-wider transition-all ${
                    categorySlug === cat.slug
                      ? "bg-[#c48a6a] text-white shadow-xs"
                      : "bg-offwhite text-teal/70 hover:bg-cream/20 hover:text-teal"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Grid de Artículos */}
        <section className="container mx-auto px-4 lg:px-8 max-w-6xl">
          {posts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-cream/40 rounded-3xl text-teal/40 font-body shadow-xs">
              <Tag size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">
                No encontramos artículos para tu búsqueda o filtro.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 mt-4 text-[#c48a6a] hover:text-[#b07a5a] font-subtitle text-xs uppercase font-bold tracking-wider"
              >
                Ver todos los posts
              </Link>
            </div>
          ) : (
            <>
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
                        <div className="absolute inset-0 bg-teal/10 group-hover:bg-transparent transition-colors z-10 animate-fade-in"></div>
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
                          {post.category ? (
                            <span className="text-[9px] uppercase tracking-[0.2em] font-subtitle font-bold text-dustypink">
                              {post.category}
                            </span>
                          ) : (
                            <span />
                          )}
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
                          Leer artículo{" "}
                          <ChevronRight
                            size={12}
                            className="ml-1 transition-transform group-hover:translate-x-1"
                          />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Controles de Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  {pageNumberArray(totalPages).map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={getPageLink(pageNum)}
                      className={`w-10 h-10 rounded-full font-subtitle text-xs font-bold flex items-center justify-center transition-all ${
                        pageNum === currentPage
                          ? "bg-[#0f3f3e] text-white shadow-md shadow-[#0f3f3e]/20"
                          : "bg-white hover:bg-cream/20 text-teal/70 border border-cream/50"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

// Función auxiliar simple para generar el array de páginas ya que no hay Lodash
function pageNumberArray(total: number): number[] {
  const result = [];
  for (let i = 1; i <= total; i++) {
    result.push(i);
  }
  return result;
}
