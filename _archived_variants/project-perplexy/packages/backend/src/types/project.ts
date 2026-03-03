export interface Project {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectDto {
  name: string
  description?: string
}

export interface UpdateProjectDto {
  name?: string
  description?: string
}

