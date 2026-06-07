import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Navbar } from "~/components/Navbar";
import { Footer } from "~/components/Footer";

export const metadata = {
  title: "Políticas y Condiciones de Atención | Estudio Pélvico",
  description:
    "Políticas y condiciones de reserva, modificaciones, inasistencias y atención para pacientes de Estudio Pélvico.",
};

export default function PoliticasAtencionPage() {
  return (
    <>
      <Navbar forceSolid={true} />

      <main className="min-h-screen bg-offwhite pt-32 pb-24 font-body text-teal">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Volver */}
          <Link
            href="/"
            className="inline-flex items-center text-teal hover:text-terracotta font-subtitle text-xs uppercase tracking-widest font-bold mb-10 transition-colors gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          {/* Contenedor Principal */}
          <div className="bg-white rounded-3xl border border-cream/50 shadow-sm overflow-hidden p-8 md:p-12">
            <header className="border-b border-cream/50 pb-8 mb-10 text-center md:text-left">
              <h1 className="font-title text-3xl md:text-4xl text-teal mb-4 leading-tight">
                Políticas y Condiciones de Atención
              </h1>
              <p className="font-body text-sm md:text-base text-teal/70 max-w-2xl">
                Al agendar una hora, el/la paciente declara haber leído y
                aceptado las siguientes condiciones generales para asegurar una
                atención de excelencia.
              </p>
            </header>

            <div className="space-y-8">
              {/* Sección 1 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cream/30 text-terracotta flex items-center justify-center shrink-0">
                  <Calendar size={20} />
                </div>
                <div className="space-y-1">
                  <h2 className="font-title text-xl text-teal">
                    1. Reserva y confirmación de hora
                  </h2>
                  <p className="font-body text-sm text-teal/80 leading-relaxed">
                    La hora se considera confirmada únicamente una vez realizada
                    la reserva a través de **AgendaPro** y/o el pago
                    correspondiente, según se indique en el flujo de
                    agendamiento.
                  </p>
                </div>
              </div>

              {/* Sección 2 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cream/30 text-terracotta flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div className="space-y-1">
                  <h2 className="font-title text-xl text-teal">
                    2. Modificaciones y cancelaciones
                  </h2>
                  <p className="font-body text-sm text-teal/80 leading-relaxed">
                    Las horas pueden ser modificadas o canceladas libremente
                    **hasta las 18:00 hrs del día hábil anterior a la cita**.
                    Posterior a ese horario, no se permiten cambios ni
                    cancelaciones bajo la modalidad regular.
                  </p>
                </div>
              </div>

              {/* Sección 3 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cream/30 text-terracotta flex items-center justify-center shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div className="space-y-1">
                  <h2 className="font-title text-xl text-teal">
                    3. Inasistencia y cancelaciones tardías
                  </h2>
                  <p className="font-body text-sm text-teal/80 leading-relaxed">
                    En caso de no asistir a la cita acordada o de solicitar
                    modificaciones/cancelaciones fuera del plazo estipulado,
                    **la sesión se considerará realizada**, sin derecho a
                    reembolsos ni devoluciones de ningún tipo.
                  </p>
                </div>
              </div>

              {/* Sección 4 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cream/30 text-terracotta flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div className="space-y-1">
                  <h2 className="font-title text-xl text-teal">
                    4. Excepciones por urgencia médica
                  </h2>
                  <p className="font-body text-sm text-teal/80 leading-relaxed">
                    En caso de verse afectado(a) por una **urgencia médica
                    real** (accidente o enfermedad aguda imprevista), se podrá
                    evaluar individualmente la reprogramación de la hora. Para
                    ello, es indispensable presentar el respaldo correspondiente
                    (ej: certificado médico emitido o comprobante de urgencia).
                    Estas situaciones serán analizadas y consideradas de manera
                    estrictamente excepcional.
                  </p>
                </div>
              </div>

              {/* Sección 5 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cream/30 text-terracotta flex items-center justify-center shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div className="space-y-1">
                  <h2 className="font-title text-xl text-teal">
                    5. Medio de contacto
                  </h2>
                  <p className="font-body text-sm text-teal/80 leading-relaxed">
                    Todas las coordinaciones, consultas u orientaciones clínicas
                    se realizan **exclusivamente dentro del horario de atención
                    presencial**. Los mensajes recibidos fuera de este horario
                    laboral serán respondidos en el siguiente bloque disponible.
                  </p>
                </div>
              </div>
            </div>

            {/* Aceptación final */}
            <div className="mt-12 p-6 bg-[#f7f3ef] border border-cream/50 rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={24} className="text-terracotta shrink-0" />
              <p className="font-subtitle text-xs font-bold uppercase tracking-wider text-teal">
                Al agendar su hora en el Estudio, usted declara aceptar
                íntegramente estas políticas de atención.
              </p>
            </div>

            <footer className="mt-10 border-t border-cream/20 pt-6 flex justify-between items-center text-[11px] font-subtitle uppercase tracking-widest text-[#0f3f3e]/40 font-bold">
              <span>Última actualización: Junio 2026</span>
              <span>Estudio Pélvico Camila Ortiz</span>
            </footer>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
