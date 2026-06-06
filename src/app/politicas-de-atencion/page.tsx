import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: "Políticas de Atención | Estudio Pélvico",
  description: "Políticas de atención, cancelación y reembolso para pacientes de Estudio Pélvico.",
};

export default function PoliticasAtencionPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 sm:p-10">
          <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Políticas de Atención</h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6">
              Bienvenido(a) a Estudio Pélvico. Para asegurar la mejor experiencia y calidad de atención para todos nuestros pacientes, te pedimos leer cuidadosamente nuestras políticas.
            </p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. Llegada y Puntualidad</h2>
            <p className="text-slate-600 mb-4">
              Se solicita llegar con 5 a 10 minutos de anticipación a tu hora agendada. El tiempo de retraso se descontará del tiempo total de la sesión para respetar a los pacientes que vienen a continuación. Un retraso mayor a 15 minutos sin previo aviso podría considerarse como inasistencia.
            </p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. Cancelaciones y Reprogramaciones</h2>
            <p className="text-slate-600 mb-4">
              Entendemos que pueden surgir imprevistos. Si necesitas cancelar o reprogramar tu cita, te pedimos hacerlo con al menos 24 horas de anticipación. Esto nos permite ofrecer ese horario a otro paciente que lo necesite.
            </p>
            <p className="text-slate-600 mb-4">
              Las cancelaciones con menos de 24 horas de aviso o las inasistencias sin previo aviso podrían estar sujetas al cobro parcial o total del valor de la sesión.
            </p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. Pagos y Reembolsos</h2>
            <p className="text-slate-600 mb-4">
              El pago de la sesión debe realizarse al finalizar la misma, o de forma anticipada si así se ha acordado. Los servicios prestados no están sujetos a reembolso. En caso de paquetes de sesiones, estos tienen una vigencia específica que será informada al momento de la compra.
            </p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. Confidencialidad</h2>
            <p className="text-slate-600 mb-4">
              Toda la información compartida durante la sesión, así como tu ficha clínica, es estrictamente confidencial y se maneja bajo los más altos estándares de privacidad profesional.
            </p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. Comunicación</h2>
            <p className="text-slate-600 mb-8">
              Cualquier consulta sobre tu tratamiento o cambios en tu agendamiento deben realizarse por nuestros canales oficiales de contacto durante el horario de atención.
            </p>

            <div className="bg-slate-50 p-6 rounded-xl text-sm text-slate-500 border border-slate-100">
              <p>Última actualización: Junio 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
