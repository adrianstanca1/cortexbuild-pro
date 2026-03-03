# ASAgents Enhanced Multimodal Architecture

## 🚀 Dual Backend System Overview

This project now features a powerful **dual backend architecture** that combines:

- **Node.js Backend** (Port 4000): Advanced AI/multimodal processing with Google Gemini integration
- **Java Spring Boot Backend** (Port 4001): Enterprise-grade features, analytics, and business logic

## 🏗️ Architecture Components

### Node.js Backend (AI/Multimodal Service)
- **Port**: 4000
- **Purpose**: AI processing, multimodal content analysis, machine learning
- **Features**:
  - Google Gemini API integration
  - Text, image, audio, video processing
  - Real-time AI responses
  - Multimodal content understanding
  - Authentication and session management

### Java Spring Boot Backend (Enterprise Service)
- **Port**: 4001
- **Purpose**: Enterprise features, analytics, reporting, workflow management
- **Features**:
  - Advanced project analytics
  - Compliance checking and reporting
  - Cost analysis and budget management
  - Risk assessment algorithms
  - Enterprise security and authorization
  - Database management with JPA/Hibernate
  - Integration with Node.js AI services

## 🔗 Integration Architecture

The Java backend seamlessly integrates with the Node.js backend through:

1. **NodeJsIntegrationService**: Handles communication between backends
2. **EnhancedMultimodalController**: Combines AI and enterprise features
3. **Service Mesh Pattern**: Distributed processing with fallback mechanisms
4. **Data Synchronization**: Automatic sync between both systems

## 🚀 Getting Started

### Start Both Backends

1. **Start Node.js Backend** (Terminal 1):
```bash
# Ensure Node.js backend is running on port 4000
# (This should already be running based on your setup)
```

2. **Start Java Backend** (Terminal 2):
```bash
cd backend/java
java -jar target/multimodal-backend-1.0.0.jar --spring.profiles.active=dev
```

### Verify Both Services

```bash
# Check Node.js backend
curl http://localhost:4000/api/health

# Check Java backend  
curl http://localhost:4001/api/enhanced/health
```

## 🎯 Enhanced API Endpoints

### Combined Authentication
```http
POST http://localhost:4001/api/enhanced/auth/enhanced-login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response includes**:
- Node.js AI-enhanced authentication
- Java enterprise permissions
- Multi-backend capabilities
- Role-based access control

### Enhanced Project Processing
```http
POST http://localhost:4001/api/enhanced/projects/process-multimodal
Content-Type: multipart/form-data

projectId: "proj-123"
file: [uploaded file]
analysisType: "full"
```

**Features**:
- AI processing via Node.js backend
- Enterprise analysis via Java backend
- Compliance checking
- Cost analysis
- Risk assessment
- Data synchronization

### Unified Dashboard
```http
GET http://localhost:4001/api/enhanced/dashboard/unified?userId=user123
```

**Combines**:
- AI insights from Node.js
- Enterprise metrics from Java
- Real-time health monitoring
- Unified data presentation

## 🔧 System Capabilities

### Node.js AI Capabilities
- Natural language processing
- Image recognition and analysis
- Audio transcription and analysis
- Video processing
- Document analysis
- Multi-provider AI integration (Google Gemini, etc.)

### Java Enterprise Capabilities
- Advanced project analytics
- Financial reporting and budgeting
- Compliance monitoring
- Risk assessment algorithms
- Performance metrics tracking
- Enterprise security features
- Workflow management
- Data governance

## 🔄 Data Flow

```
Frontend (React) 
    ↓
Java Backend (Port 4001)
    ├── Enterprise Processing
    ├── Analytics & Reporting  
    └── Integration with Node.js ↓
                Node.js Backend (Port 4000)
                    ├── AI Processing
                    ├── Multimodal Analysis
                    └── Response ↑
Combined Results → Frontend
```

## 🛡️ Security Features

### Multi-Backend Authentication
- JWT tokens validated by both backends
- Role-based permissions across services
- Session synchronization
- Enterprise-grade security policies

### Data Protection
- Encrypted communication between services
- Input validation on both backends
- SQL injection protection
- XSS prevention
- CORS configuration

## 📊 Monitoring & Health

### Health Check Endpoints
- Node.js: `GET http://localhost:4000/api/health`
- Java: `GET http://localhost:4001/api/enhanced/health`
- Combined: `GET http://localhost:4001/api/enhanced/health` (includes both)

### Service Monitoring
The Java backend continuously monitors Node.js backend health and provides fallback mechanisms.

## 🔧 Configuration

### Java Backend Configuration
```properties
# Server Configuration
server.port=4001
spring.application.name=asagents-multimodal-backend

# Node.js Integration
app.nodejs-service.url=http://localhost:4000
app.nodejs-service.timeout=30000

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/asagents_db
spring.jpa.hibernate.ddl-auto=update
```

## 🚀 Benefits of Dual Backend Architecture

1. **Specialized Processing**: AI tasks handled by Node.js, enterprise features by Java
2. **Scalability**: Each backend can be scaled independently
3. **Reliability**: Fallback mechanisms ensure continuous operation
4. **Performance**: Optimized for different workload types
5. **Maintainability**: Clear separation of concerns
6. **Integration**: Seamless data flow between services

## 🧪 Testing the Integration

### Test Enhanced Authentication
```bash
curl -X POST http://localhost:4001/api/enhanced/auth/enhanced-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### Test Unified Health Check
```bash
curl http://localhost:4001/api/enhanced/health
```

## 📈 Future Enhancements

- [ ] WebSocket integration for real-time updates
- [ ] Advanced caching layer
- [ ] Microservices orchestration
- [ ] Performance monitoring dashboard
- [ ] Automated scaling policies
- [ ] Multi-region deployment

## 🎉 Success!

You now have a fully functional dual backend system that combines the best of both worlds:
- **AI/Multimodal processing** with Node.js
- **Enterprise features** with Java Spring Boot
- **Seamless integration** between both systems

Both backends are running simultaneously and can be used together for enhanced functionality!