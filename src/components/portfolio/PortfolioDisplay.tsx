import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Image as ImageIcon, Grid } from 'lucide-react';
import { PortfolioImage } from '@/types';

interface PortfolioDisplayProps {
  portfolioType: 'cover' | 'carousel';
  coverImage?: string;
  portfolioImages?: PortfolioImage[];
  deviceType: 'mobile' | 'tablet' | 'desktop';
  theme: any;
  showTitle?: boolean;
  useBackground?: boolean;
  hideOverlay?: boolean;
  hidePagination?: boolean;
}

export const PortfolioDisplay: React.FC<PortfolioDisplayProps> = ({
  portfolioType,
  coverImage,
  portfolioImages = [],
  deviceType,
  theme,
  showTitle = true,
  useBackground = true,
  hideOverlay = false,
  hidePagination = false
}) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const portfolioStyle = {
    backgroundColor: theme.portfolioBackground || 'rgba(255, 255, 255, 0.1)',
    borderColor: theme.portfolioBorder || 'rgba(255, 255, 255, 0.2)'
  };

  const headingStyle = {
    color: theme.headingColor || theme.textColor,
    fontFamily: theme.fontFamily
  };

  const subtitleStyle = {
    color: theme.subtitleColor || theme.textColor,
    fontFamily: theme.fontFamily
  };

  // No mostrar si no hay contenido
  if (portfolioType === 'cover' && !coverImage) return null;
  if (portfolioType === 'carousel' && portfolioImages.length === 0) return null;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % portfolioImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + portfolioImages.length) % portfolioImages.length);
  };

  // Funciones para manejar gestos táctiles
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && portfolioImages.length > 1) {
      nextSlide();
    }
    if (isRightSwipe && portfolioImages.length > 1) {
      prevSlide();
    }
  };

  const getImageSizeClasses = () => {
    if (!useBackground) {
      return 'h-[600px]'; // Altura fija de 600px como solicitaste
    }
    switch (deviceType) {
      case 'mobile':
        return 'h-48';
      case 'tablet':
        return 'h-64';
      case 'desktop':
        return 'h-80';
      default:
        return 'h-48';
    }
  };

  const getGridClasses = () => {
    switch (deviceType) {
      case 'mobile':
        return 'grid-cols-2';
      case 'tablet':
        return 'grid-cols-3';
      case 'desktop':
        return 'grid-cols-4';
      default:
        return 'grid-cols-2';
    }
  };

  const getTitleSize = () => {
    switch (deviceType) {
      case 'mobile':
        return 'text-xl';
      case 'tablet':
        return 'text-2xl';
      case 'desktop':
        return 'text-4xl';
      default:
        return 'text-xl';
    }
  };

  const getIconSize = () => {
    switch (deviceType) {
      case 'mobile':
        return 20;
      case 'tablet':
        return 24;
      case 'desktop':
        return 32;
      default:
        return 20;
    }
  };

  // Modal de imagen ampliada
  const ImageModal = () => {
    if (selectedImage === null) return null;

    const image = portfolioImages[selectedImage];
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
        <div className="relative max-w-4xl max-h-full">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
          >
            <X size={32} />
          </button>
          <img
            src={image.urls.large}
            alt={image.fileName}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          {portfolioImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              <button
                onClick={() => setSelectedImage((selectedImage - 1 + portfolioImages.length) % portfolioImages.length)}
                className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setSelectedImage((selectedImage + 1) % portfolioImages.length)}
                className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6 relative">
        {showTitle && (
          <header className="absolute top-0 left-0 right-0 px-4 z-20">
            <div className="bg-white rounded-3xl shadow-lg px-4 py-3 flex items-center justify-between">
              <h2 className={`${getTitleSize()} font-bold flex items-center`} style={{color:'#000',fontFamily:headingStyle.fontFamily}}>
                {portfolioType === 'cover' ? <ImageIcon size={getIconSize()} className="mr-3 text-gray-900" /> : <Grid size={getIconSize()} className="mr-3 text-gray-900" />}
                Portfolio
              </h2>
              {portfolioImages.length > 0 && (
                <div className="flex items-center space-x-2 bg-black/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-black/40 rounded-full"></div>
                  <span className="text-gray-800 text-xs font-medium">{portfolioImages.length}</span>
                </div>
              )}
            </div>
          </header>
        )}

        {portfolioType === 'cover' && coverImage && (
          <div 
            className="backdrop-blur-xl rounded-2xl p-4 border mt-16"
            style={{
              backgroundColor: portfolioStyle.backgroundColor,
              borderColor: portfolioStyle.borderColor
            }}
          >
            <div className="relative group cursor-pointer" onClick={() => setSelectedImage(0)}>
              <img
                src={coverImage}
                alt="Portfolio Cover"
                className={`w-full ${getImageSizeClasses()} object-cover rounded-lg`}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <ImageIcon size={24} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {portfolioType === 'carousel' && portfolioImages.length > 0 && (
          <div 
            className={useBackground ? `backdrop-blur-xl rounded-3xl border shadow-xl ${deviceType === 'mobile' ? 'p-0' : 'p-6'}` : ""}
            style={useBackground ? {
              backgroundColor: portfolioStyle.backgroundColor,
              borderColor: portfolioStyle.borderColor
            } : {}}
          >
            {deviceType === 'mobile' && (
              <div className="relative -mx-4">
                <div 
                  className="overflow-hidden shadow-2xl rounded-3xl"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <div 
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {portfolioImages.map((image, index) => (
                      <div key={image.id} className="w-full flex-shrink-0 relative">
                        <img
                          src={image.urls.large}
                          alt={image.fileName}
                          className="w-full h-[500px] object-cover cursor-pointer"
                          onClick={() => setSelectedImage(index)}
                        />
                        {/* Overlay gradient suave estilo iOS */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                        {/* Información de la imagen flotante */}
                        {!hideOverlay && (
                        <div className="absolute bottom-6 left-6 right-6">
                          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium text-sm">
                                  {image.fileName || `Imagen ${index + 1}`}
                                </p>
                                <p className="text-white/70 text-xs">
                                  Toca para ver en grande
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {portfolioImages.length > 1 && !hidePagination && (
                  <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center z-10 space-y-2">
                    <div className="flex space-x-2 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                      {portfolioImages.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentSlide(index)}
                          className={`h-1 rounded-full cursor-pointer transition-all duration-300 ${
                            index === currentSlide
                              ? 'bg-white w-8 shadow-lg'
                              : 'bg-white/40 w-2'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium">
                      {currentSlide + 1} de {portfolioImages.length}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(deviceType === 'tablet' || deviceType === 'desktop') && (
              // Grid para tablet y desktop
              <div className={`grid ${getGridClasses()} gap-3`}>
                {portfolioImages.map((image, index) => (
                  <div key={image.id} className="relative group cursor-pointer" onClick={() => setSelectedImage(index)}>
                    <img
                      src={image.urls.medium}
                      alt={image.fileName}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <ImageIcon size={16} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {portfolioImages.length === 0 && (
              <div className="text-center py-8">
                <Grid size={48} className="text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400" style={subtitleStyle}>
                  No hay imágenes en el portfolio
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <ImageModal />
    </>
  );
};