import { Navbar } from "~/components/Navbar";
import { Footer } from "~/components/Footer";
import { sanityClient } from "~/lib/sanity";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";

// Standard components for rendering portable text beautifully
const portableTextComponents = {
  block: {
    h1: ({ children }: any) => <h1 className="font-title text-4xl md:text-5xl text-teal mt-12 mb-6 leading-tight">{children}</h1>,
    h2: ({ children }: any) => <h2 className="font-title text-3xl md:text-4xl text-teal mt-10 mb-5 leading-tight">{children}</h2>,
    h3: ({ children }: any) => <h3 className="font-subtitle text-xl font-bold text-teal mt-8 mb-4 tracking-wide">{children}</h3>,
    normal: ({ children }: any) => <p className="font-body text-lg text-teal/80 leading-relaxed mb-6">{children}</p>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-terracotta bg-cream/10 p-6 my-8 rounded-r-2xl italic text-teal/95 font-body text-lg">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => <ul className="list-disc pl-6 mb-6 space-y-2 font-body text-lg text-teal/80">{children}</ul>,
    number: ({ children }: any) => <ol className="list-decimal pl-6 mb-6 space-y-2 font-body text-lg text-teal/80">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: any) => <li>{children}</li>,
    number: ({ children }: any) => <li>{children}</li>,
  },
};

const fallbackPosts: Record<string, {
  title: string;
  category: string;
  image: string;
  date: string;
  author: string;
  description: string;
  content: React.ReactNode;
}> = {
  "cicatriz-hipertrofica-o-queloide": {
    title: "Mi cicatriz: ¿Es hipertrófica o queloide?",
    category: "CONSEJOS",
    image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    date: "25 de Febrero, 2026",
    author: "Camila Ortiz",
    description: "Aprende a diferenciar el tipo de cicatrización y conoce las opciones de tratamiento disponibles para mejorar su aspecto y funcionalidad.",
    content: (
      <>
        <p className="font-body text-lg text-teal/80 leading-relaxed mb-6">
          Cuando nos sometemos a una cirugía o sufrimos una herida profunda, el proceso de cicatrización es clave no solo para la estética, sino para la funcionalidad de nuestro cuerpo. Dos de las alteraciones más comunes en la curación son las cicatrices hipertróficas y los queloides. Aunque a menudo se confunden, tienen características distintas y requieren enfoques terapéuticos diferentes.
        </p>
        <h2 className="font-title text-3xl md:text-4xl text-teal mt-10 mb-5 leading-tight">Cicatriz Hipertrófica vs. Queloide</h2>
        <p className="font-body text-lg text-teal/80 leading-relaxed mb-6">
          La principal diferencia radica en los límites de la lesión original. Una <strong>cicatriz hipertrófica</strong> se mantiene dentro de los bordes de la herida original, aunque se presenta elevada, roja y a veces molesta. Por lo general, aparece pocas semanas después de la lesión y puede mejorar de forma espontánea a lo largo de un año.
        </p>
        <p className="font-body text-lg text-teal/80 leading-relaxed mb-6">
          En cambio, el <strong>queloide</strong> sobrepasa los límites de la herida original, extendiéndose hacia el tejido sano circundante. Es una producción descontrolada de colágeno que no mejora por sí sola y puede seguir creciendo con el tiempo. Suele ser rígida, picar o causar dolor al tacto.
        </p>
        <blockquote className="border-l-4 border-terracotta bg-cream/10 p-6 my-8 rounded-r-2xl italic text-teal/95 font-body text-lg">
          "El tratamiento temprano de una cicatriz puede prevenir restricciones de movilidad y dolores crónicos derivados de adherencias tisulares."
        </blockquote>
        <h2 className="font-title text-3xl md:text-4xl text-teal mt-10 mb-5 leading-tight">¿Cómo puede ayudarte la kinesiología integral?</h2>
        <p className="font-body text-lg text-teal/80 leading-relaxed mb-6">
          El tratamiento kinésico de cicatrices va mucho más allá de la aplicación de cremas. Mediante técnicas especializadas de terapia manual, movilización de tejidos profundos, presoterapia, silicona grado médico y herramientas tecnológicas, es posible:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2 font-body text-lg text-teal/80">
          <li>Liberar adherencias que limitan el movimiento muscular o articular.</li>
          <li>Reducir la inflamación y el enrojecimiento al mejorar la microcirculación local.</li>
          <li>Disminuir la sensación de tirantez, picazón o dolor.</li>
          <li>Flexibilizar el tejido para lograr una cicatrización plana y funcional.</li>
        </ul>
        <p className="font-body text-lg text-teal/80 leading-relaxed mb-6">
          Si tienes una cicatriz reciente (como una cesárea, abdominoplastia o cirugía traumatológica) o una antigua que te genera molestias, te invito a una evaluación para diseñar un plan a tu medida.
        </p>
      </>
    )
  },
  "cesarea-recuperacion-postparto": {
    title: "La cesárea no es el camino fácil: tips y recomendaciones",
    category: "MATERNIDAD",
    image: "https://images.unsplash.com/photo-1606240212788-b2170cbae985?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    date: "18 de Febrero, 2026",
    author: "Camila Ortiz",
    description: "El proceso de recuperación post-cesárea requiere cuidados específicos. Te entregamos información valiosa para una recuperación óptima.",
    content: (
      <>
        <p className="font-body text-lg text-teal/80 leading-relaxed mb-6">
          Todavía existe el mito de que la cesárea es una alternativa "fácil" o "menos dolorosa" al parto vaginal. La realidad es que una cesárea es una cirugía mayor en la que se cortan múltiples capas de tejido, incluyendo la piel, grasa, fascia, músculo (que se separa) y el útero. La recuperación es un proceso complejo que requiere paciencia, cuidado y, idealmente, acompañamiento profesional.
        </p>
        <h2 className="font-title text-3xl md:text-4xl text-teal mt-10 mb-5 leading-tight">Primeras semanas: cuidado de la herida y postura</h2>
        <p className="font-body text-lg text-teal/80 leading-relaxed mb-6">
          Durante las primeras 2 a 4 semanas, la prioridad absoluta es la cicatrización superficial de la piel. Es fundamental mantener la zona limpia y seca, evitando esfuerzos que aumenten la presión intraabdominal. 
        </p>
        <p className="font-body text-lg text-teal/80 leading-relaxed mb-6">
          Un consejo clave para levantarse de la cama es ponerse siempre de costado primero y ayudarse con los brazos para sentarse, evitando realizar el movimiento de "abdominal" tradicional, el cual tensiona la cicatriz y la musculatura debilitada.
        </p>
        <h2 className="font-title text-3xl md:text-4xl text-teal mt-10 mb-5 leading-tight">El cuidado de la cicatriz a mediano plazo</h2>
        <p className="font-body text-lg text-teal/80 leading-relaxed mb-6">
          Una vez que los puntos o corchetes han sido retirados y la piel está completamente cerrada (generalmente a partir de la semana 4-6), es momento de comenzar a trabajar la cicatriz para evitar adherencias. Las adherencias ocurren cuando los tejidos cicatrizan pegándose a las capas inferiores, lo que puede provocar:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2 font-body text-lg text-teal/80">
          <li>Sensación de tirantez al erguirse por completo.</li>
          <li>Dolor en la zona pélvica o lumbar.</li>
          <li>Urgencia miccional (debido a la cercanía del útero con la vejiga).</li>
          <li>Pérdida de sensibilidad o hipersensibilidad (sensación de adormecimiento).</li>
        </ul>
        <blockquote className="border-l-4 border-terracotta bg-cream/10 p-6 my-8 rounded-r-2xl italic text-teal/95 font-body text-lg">
          "El masaje de la cicatriz de cesárea debe comenzar de forma suave y progresiva para reeducar la sensibilidad y devolver la elasticidad a los tejidos."
        </blockquote>
        <h2 className="font-title text-3xl md:text-4xl text-teal mt-10 mb-5 leading-tight">La importancia de evaluar tu suelo pélvico</h2>
        <p className="font-body text-lg text-teal/80 leading-relaxed mb-6">
          Aunque el bebé no haya nacido por el canal vaginal, tu suelo pélvico cargó con el peso del embarazo durante 9 meses y sufrió cambios hormonales que flexibilizan los ligamentos. Una evaluación kinésica postparto (a partir de la sexta semana) te ayudará a reactivar la faja abdominal, fortalecer el suelo pélvico de manera segura y recuperar la confianza en tu cuerpo.
        </p>
      </>
    )
  }
};

async function getPostData(slug: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "placeholder") {
      return null;
    }
    const data = await sanityClient.fetch(
      `*[_type == "post" && slug.current == $slug][0] {
        title,
        "image": mainImage.asset->url,
        "category": category->title,
        publishedAt,
        body
      }`,
      { slug }
    );
    return data || null;
  } catch (error) {
    console.error("Error fetching post from Sanity:", error);
    return null;
  }
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const sanityPost = await getPostData(slug);
  const fallbackPost = fallbackPosts[slug];

  if (!sanityPost && !fallbackPost) {
    notFound();
  }

  const title = sanityPost?.title || fallbackPost?.title;
  const category = sanityPost?.category || fallbackPost?.category;
  const image = sanityPost?.image || fallbackPost?.image;
  const dateText = sanityPost?.publishedAt 
    ? new Date(sanityPost.publishedAt).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })
    : fallbackPost?.date;
  const author = fallbackPost?.author || "Camila Ortiz";

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen pt-32 pb-24 bg-offwhite">
        <article className="container mx-auto px-4 max-w-4xl">
          {/* Back Link */}
          <Link 
            href="/#blog" 
            className="inline-flex items-center text-teal hover:text-terracotta font-subtitle text-xs uppercase tracking-widest font-bold mb-10 transition-colors gap-2"
          >
            <ArrowLeft size={16} /> Volver al Blog
          </Link>

          {/* Post Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-cream/30 text-redbrown rounded-full font-subtitle text-[10px] uppercase tracking-widest font-bold">
                <Tag size={12} /> {category}
              </span>
            </div>

            <h1 className="font-title text-4xl md:text-5xl lg:text-6xl text-teal mb-8 leading-tight">
              {title}
            </h1>

            {/* Metadata bar */}
            <div className="flex flex-wrap items-center gap-6 border-y border-cream/50 py-4 font-subtitle text-xs text-teal/60">
              <span className="flex items-center gap-2">
                <User size={14} className="text-terracotta" /> Por {author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={14} className="text-terracotta" /> {dateText}
              </span>
            </div>
          </header>

          {/* Main Image */}
          {image && (
            <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-lg border-[8px] border-white mb-12">
              <img 
                src={image} 
                alt={title} 
                className="w-full h-full object-cover" 
              />
            </div>
          )}

          {/* Post Content */}
          <div className="prose prose-teal max-w-none bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-cream/30">
            {sanityPost?.body ? (
              <PortableText value={sanityPost.body} components={portableTextComponents} />
            ) : (
              fallbackPost?.content
            )}
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
