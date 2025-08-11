import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Users, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const Home: React.FC = () => {
  return (
    <div className="space-y-20">
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Tu tarjeta digital
            <br />
            <span className="text-primary-600">profesional</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Crea tu presencia digital en minutos. Comparte tus links importantes y gestiona tus reservas desde una sola plataforma.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto">
              Comenzar gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/demo">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Ver demo
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <Card className="text-center space-y-4">
          <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto">
            <Star className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Diseño profesional
          </h3>
          <p className="text-gray-600">
            Plantillas diseñadas por expertos que se adaptan a tu marca personal o negocio.
          </p>
        </Card>

        <Card className="text-center space-y-4">
          <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto">
            <Users className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Fácil de compartir
          </h3>
          <p className="text-gray-600">
            Un solo link para compartir todos tus enlaces importantes en redes sociales.
          </p>
        </Card>

        <Card className="text-center space-y-4">
          <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto">
            <Calendar className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Sistema de reservas
          </h3>
          <p className="text-gray-600">
            Permite a tus clientes reservar citas directamente desde tu tarjeta digital.
          </p>
        </Card>
      </section>

      <section className="bg-primary-50 rounded-2xl p-8 md:p-12 text-center">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            ¿Listo para comenzar?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Únete a miles de profesionales que ya usan Klycs para potenciar su presencia digital.
          </p>
          <Link to="/register">
            <Button size="lg" className="mt-6">
              Crear mi tarjeta gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer with Business Access */}
      <footer className="border-t border-gray-200 pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900">KLYCS</h3>
              <p className="text-gray-600 text-sm">
                La plataforma líder para crear tarjetas digitales profesionales y gestionar tu presencia online.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Enlaces rápidos</h4>
              <div className="space-y-2">
                <Link to="/demo" className="block text-sm text-gray-600 hover:text-primary-600">
                  Ver Demo
                </Link>
                <Link to="/pricing" className="block text-sm text-gray-600 hover:text-primary-600">
                  Precios
                </Link>
                <Link to="/help" className="block text-sm text-gray-600 hover:text-primary-600">
                  Ayuda
                </Link>
              </div>
            </div>

            {/* Business Access */}
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">KLYCS Business</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Acceso al panel de administración para gestionar plantillas y usuarios.
                </p>
                <Link to="/admin/login">
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                    Acceder al Panel
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 mt-2">
                  Solo para administradores autorizados
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-sm text-gray-500">
                © 2024 KLYCS. Todos los derechos reservados.
              </p>
              <div className="flex space-x-4 mt-4 sm:mt-0">
                <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                  Términos
                </Link>
                <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                  Privacidad
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};