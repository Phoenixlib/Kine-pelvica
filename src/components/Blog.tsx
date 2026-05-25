import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface Post {
  id?: string | number;
  _id?: string;
  image: string;
  category: string;
  title: string;
  description: string;
  slug?: string;
}

interface BlogProps {
  initialPosts?: Post[] | null;
}

export function Blog({ initialPosts }: BlogProps) {
  const fallbackPosts: Post[] = [
    {
      id: 1,
      slug: "cicatriz-hipertrofica-o-queloide",
      image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "CONSEJOS",
      title: "Mi cicatriz: ¿Es hipertrófica o queloide?",
      description: "Aprende a diferenciar el tipo de cicatrización y conoce las opciones de tratamiento disponibles para mejorar su aspecto y funcionalidad."
    },
    {
      id: 2,
      slug: "cesarea-recuperacion-postparto",
      image: "https://images.unsplash.com/photo-1606240212788-b2170cbae985?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "MATERNIDAD",
      title: "La cesárea no es el camino fácil: tips y recomendaciones",
      description: "El proceso de recuperación post-cesárea requiere cuidados específicos. Te entregamos información valiosa para una recuperación óptima."
    }
  ];

  const posts = initialPosts || fallbackPosts;

  return (
    <section id="blog" className="py-24 bg-cream">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-redbrown uppercase mb-4">Blog</h2>
            <h3 className="font-title text-4xl md:text-5xl text-teal"><span className="italic font-light text-terracotta">Últimas</span> Publicaciones</h3>
          </div>
          <Link href="/blog" className="font-subtitle text-[11px] uppercase tracking-widest font-bold text-teal hover:text-terracotta border-b border-teal hover:border-terracotta transition-colors pb-1 flex-shrink-0">
            Ver todos los artículos
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {posts.map((post) => {
            const postSlug = post.slug || `fallback-${post.id || post._id}`;
            return (
              <Link 
                href={`/blog/${postSlug}`}
                key={post.id || post._id} 
                className="group cursor-pointer flex flex-col bg-white border border-cream/50 rounded-3xl shadow-sm hover:shadow-xl hover:border-teal/20 transition-all duration-300 overflow-hidden"
              >
                <div className="aspect-video w-full overflow-hidden relative">
                   <div className="absolute inset-0 bg-teal/10 group-hover:bg-transparent transition-colors z-10"></div>
                   <img 
                     src={post.image}
                     alt={post.title}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                   />
                </div>
                <div className="p-8 md:p-10 flex-1 flex flex-col">
                   <span className="text-[10px] uppercase tracking-[0.2em] font-subtitle font-bold text-dustypink mb-4 block">{post.category}</span>
                   <h4 className="font-title text-2xl text-teal group-hover:text-redbrown transition-colors leading-[1.3] mb-4">
                     {post.title}
                   </h4>
                   <p className="font-body text-teal/70 mb-6 flex-1 line-clamp-3">
                     {post.description}
                   </p>
                   <span className="font-subtitle text-[11px] font-bold uppercase tracking-widest text-terracotta flex items-center mt-auto">
                     Leer artículo <ChevronRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                   </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
