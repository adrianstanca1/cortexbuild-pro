import fs from 'fs/promises'
import path from 'path'
import { DrawingMap, LayoutData } from '../types/location.js'
import { v4 as uuidv4 } from 'uuid'

const DRAWINGS_DIR = path.join(process.cwd(), 'storage', 'drawings')
const MAPS_DIR = path.join(process.cwd(), 'storage', 'maps')

// In-memory storage for demo (replace with database in production)
const drawingMaps = new Map<string, DrawingMap>()

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DRAWINGS_DIR, { recursive: true })
    await fs.mkdir(MAPS_DIR, { recursive: true })
  } catch (error) {
    // Directories might already exist
  }
}

export const drawingService = {
  /**
   * Process and save drawing
   */
  async processDrawing(
    filePath: string,
    projectId: string,
    fileName: string
  ): Promise<DrawingMap> {
    await ensureDirectories()

    // In a real implementation, this would call a Python microservice
    // to process the PDF and extract layout data
    // For now, we'll create a placeholder layout
    const layoutData: LayoutData = await this.extractLayoutFromPDF(filePath)

    const drawingMap: DrawingMap = {
      projectId,
      drawingFile: fileName,
      layoutData,
      createdAt: new Date(),
    }

    const mapId = uuidv4()
    drawingMaps.set(mapId, drawingMap)

    return drawingMap
  },

  /**
   * Extract layout from PDF (placeholder - would call Python service)
   */
  async extractLayoutFromPDF(_filePath: string): Promise<LayoutData> {
    // TODO: Integrate with Python microservice for PDF processing
    // This is a placeholder that returns sample data
    
    // In production, this would:
    // 1. Call Python service: POST /api/pdf/process
    // 2. Python service uses PyMuPDF/pdfplumber to extract layout
    // 3. Return structured layout data

    // Placeholder layout data
    return {
      zones: [
        {
          id: 'zone-1',
          name: 'Main Building',
          coordinates: [
            { lat: 40.7128, lng: -74.0060 },
            { lat: 40.7138, lng: -74.0060 },
            { lat: 40.7138, lng: -74.0070 },
            { lat: 40.7128, lng: -74.0070 },
          ],
          type: 'building',
        },
      ],
      boundaries: [
        {
          coordinates: [
            { lat: 40.7118, lng: -74.0050 },
            { lat: 40.7148, lng: -74.0050 },
            { lat: 40.7148, lng: -74.0080 },
            { lat: 40.7118, lng: -74.0080 },
          ],
          type: 'fence',
        },
      ],
      metadata: {
        scale: 100,
        units: 'feet',
        orientation: 0,
      },
    }
  },

  /**
   * Get drawing map by project ID
   */
  async getDrawingMap(projectId: string): Promise<DrawingMap | null> {
    for (const map of drawingMaps.values()) {
      if (map.projectId === projectId) {
        return map
      }
    }
    return null
  },

  /**
   * Get all drawing maps
   */
  async getAllDrawingMaps(): Promise<DrawingMap[]> {
    return Array.from(drawingMaps.values())
  },

  /**
   * Delete drawing map
   */
  async deleteDrawingMap(projectId: string): Promise<void> {
    for (const [id, map] of drawingMaps.entries()) {
      if (map.projectId === projectId) {
        drawingMaps.delete(id)
        // Delete file if it exists
        try {
          const filePath = path.join(DRAWINGS_DIR, map.drawingFile)
          await fs.unlink(filePath)
        } catch (error) {
          // File might not exist
        }
        break
      }
    }
  },
}

