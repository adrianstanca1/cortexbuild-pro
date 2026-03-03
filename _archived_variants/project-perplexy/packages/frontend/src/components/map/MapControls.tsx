import { ZoomIn, ZoomOut, RotateCw, Maximize2, Layers, Navigation } from 'lucide-react'

interface MapControlsProps {
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetView?: () => void
  onFullscreen?: () => void
  onToggleLayers?: () => void
  onLocate?: () => void
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onFullscreen,
  onToggleLayers,
  onLocate,
}: MapControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {onLocate && (
        <button
          onClick={onLocate}
          className="map-control-btn bg-white hover:bg-teal-500 text-gray-800 hover:text-white transition-colors"
          title="Locate Me"
          aria-label="Locate Me"
        >
          <Navigation className="w-5 h-5" />
        </button>
      )}
      {onZoomIn && (
        <button
          onClick={onZoomIn}
          className="map-control-btn bg-white hover:bg-teal-500 text-gray-800 hover:text-white transition-colors"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      )}
      {onZoomOut && (
        <button
          onClick={onZoomOut}
          className="map-control-btn bg-white hover:bg-teal-500 text-gray-800 hover:text-white transition-colors"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      )}
      {onResetView && (
        <button
          onClick={onResetView}
          className="map-control-btn bg-white hover:bg-teal-500 text-gray-800 hover:text-white transition-colors"
          title="Reset View"
          aria-label="Reset View"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      )}
      {onToggleLayers && (
        <button
          onClick={onToggleLayers}
          className="map-control-btn bg-white hover:bg-teal-500 text-gray-800 hover:text-white transition-colors"
          title="Toggle Layers"
          aria-label="Toggle Layers"
        >
          <Layers className="w-5 h-5" />
        </button>
      )}
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="map-control-btn bg-white hover:bg-teal-500 text-gray-800 hover:text-white transition-colors"
          title="Fullscreen"
          aria-label="Fullscreen"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
