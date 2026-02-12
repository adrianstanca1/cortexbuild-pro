import React, { useState, useEffect, useMemo } from 'react';
import { Cloud, CloudRain, Wind, Thermometer, AlertTriangle, MapPin, TrendingUp } from 'lucide-react';
import './WeatherIntegrationService.css';

interface WeatherCondition {
    id: string;
    type: 'temperature' | 'precipitation' | 'wind' | 'visibility' | 'pressure' | 'humidity';
    severity: 'low' | 'medium' | 'high' | 'extreme';
    description: string;
    impact: {
        operations: string[];
        safety: string[];
        schedule: string[];
    };
    threshold: {
        warning: number;
        critical: number;
        extreme: number;
    };
    currentValue?: number;
    unit: string;
    icon: React.ReactNode;
}

interface WeatherData {
    location: {
        lat: number;
        lng: number;
        name: string;
    };
    current: {
        temperature: number;
        humidity: number;
        windSpeed: number;
        windDirection: number;
        pressure: number;
        visibility: number;
        conditions: string;
        timestamp: Date;
    };
    forecast: Array<{
        date: Date;
        high: number;
        low: number;
        conditions: string;
        precipitation: number;
        windSpeed: number;
    }>;
    alerts: Array<{
        type: string;
        severity: string;
        description: string;
        startTime: Date;
        endTime: Date;
    }>;
    riskAssessment: {
        overall: number;
        factors: string[];
        recommendations: string[];
    };
}

interface WeatherIntegrationServiceProps {
    projectLocation?: {
        lat: number;
        lng: number;
        name: string;
    };
    onRiskUpdate?: (risks: WeatherCondition[]) => void;
    enableRealTime?: boolean;
}

const WeatherIntegrationService: React.FC<WeatherIntegrationServiceProps> = ({
    projectLocation,
    onRiskUpdate,
    enableRealTime = true
}) => {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCondition, setSelectedCondition] = useState<WeatherCondition | null>(null);

    // Mock weather conditions that could impact projects
    const weatherConditions: WeatherCondition[] = useMemo(
        () => [
            {
                id: 'extreme-heat',
                type: 'temperature',
                severity: 'extreme',
                description: 'Extreme heat conditions (>100°F/38°C)',
                impact: {
                    operations: ['Reduced worker productivity', 'Equipment overheating', 'Material handling issues'],
                    safety: ['Heat exhaustion risk', 'Dehydration hazards', 'Sun exposure'],
                    schedule: ['Extended break periods required', 'Work hour limitations']
                },
                threshold: { warning: 90, critical: 100, extreme: 110 },
                unit: '°F',
                icon: <Thermometer className="text-red-500" />,
                currentValue: weatherData?.current.temperature
            },
            {
                id: 'heavy-precipitation',
                type: 'precipitation',
                severity: 'high',
                description: 'Heavy precipitation (>2in/50mm)',
                impact: {
                    operations: ['Outdoor work stoppage', 'Site access issues', 'Material delivery delays'],
                    safety: ['Slip hazards', 'Reduced visibility', 'Electrical risks'],
                    schedule: ['Work stoppages', 'Extended timelines']
                },
                threshold: { warning: 1, critical: 2, extreme: 3 },
                unit: 'inches',
                icon: <CloudRain className="text-blue-500" />,
                currentValue: weatherData?.forecast.reduce((acc, day) => acc + day.precipitation, 0)
            },
            {
                id: 'high-winds',
                type: 'wind',
                severity: 'high',
                description: 'High wind conditions (>25mph/40kph)',
                impact: {
                    operations: ['Crane operation limits', 'Lifting restrictions', 'Scaffold safety concerns'],
                    safety: ['Falling object risks', 'Crane instability', 'Worker exposure'],
                    schedule: ['Equipment limitations', 'Safety protocols required']
                },
                threshold: { warning: 20, critical: 25, extreme: 35 },
                unit: 'mph',
                icon: <Wind className="text-gray-500" />,
                currentValue: weatherData?.current.windSpeed
            },
            {
                id: 'poor-visibility',
                type: 'visibility',
                severity: 'medium',
                description: 'Poor visibility conditions (<1/4 mile)',
                impact: {
                    operations: ['Reduced work precision', 'Safety inspection limitations'],
                    safety: ['Increased accident risk', 'Navigation hazards'],
                    schedule: ['Quality control delays', 'Inspection postponements']
                },
                threshold: { warning: 0.5, critical: 0.25, extreme: 0.125 },
                unit: 'miles',
                icon: <Cloud className="text-gray-400" />,
                currentValue: weatherData?.current.visibility
            },
            {
                id: 'low-pressure',
                type: 'pressure',
                severity: 'medium',
                description: 'Low pressure systems (<29.5inHg)',
                impact: {
                    operations: ['Storm preparation needed', 'Equipment securing required'],
                    safety: ['Storm damage risk', 'Flying debris hazards'],
                    schedule: ['Protective measures', 'Potential evacuation']
                },
                threshold: { warning: 30, critical: 29.5, extreme: 29 },
                unit: 'inHg',
                icon: <AlertTriangle className="text-orange-500" />,
                currentValue: weatherData?.current.pressure
            },
            {
                id: 'high-humidity',
                type: 'humidity',
                severity: 'low',
                description: 'High humidity conditions (>85%)',
                impact: {
                    operations: ['Material handling issues', 'Equipment efficiency reduction'],
                    safety: ['Slip hazards', 'Mold growth risk'],
                    schedule: ['Extended drying times', 'Quality concerns']
                },
                threshold: { warning: 75, critical: 85, extreme: 95 },
                unit: '%',
                icon: <Cloud className="text-blue-400" />,
                currentValue: weatherData?.current.humidity
            }
        ],
        [weatherData]
    );

    // Assess current weather risks
    const activeWeatherRisks = useMemo(() => {
        if (!weatherData) return [];

        return weatherConditions.filter((condition) => {
            if (condition.currentValue === undefined) return false;

            switch (condition.severity) {
                case 'extreme':
                    return condition.currentValue >= condition.threshold.extreme;
                case 'high':
                    return condition.currentValue >= condition.threshold.critical;
                case 'medium':
                    return condition.currentValue >= condition.threshold.warning;
                case 'low':
                    return condition.currentValue >= condition.threshold.warning;
                default:
                    return false;
            }
        });
    }, [weatherData, weatherConditions]);

    // Calculate overall weather risk score
    const weatherRiskScore = useMemo(() => {
        if (!weatherData) return 0;

        let score = 0;
        activeWeatherRisks.forEach((risk) => {
            switch (risk.severity) {
                case 'extreme':
                    score += 40;
                    break;
                case 'high':
                    score += 25;
                    break;
                case 'medium':
                    score += 15;
                    break;
                case 'low':
                    score += 5;
                    break;
            }
        });

        return Math.min(score, 100);
    }, [activeWeatherRisks]);

    // Generate risk recommendations
    const riskRecommendations = useMemo(() => {
        const recommendations: string[] = [];

        activeWeatherRisks.forEach((risk) => {
            recommendations.push(...risk.impact.safety.map((s) => `Safety: ${s}`));
            recommendations.push(...risk.impact.operations.map((o) => `Operations: ${o}`));
        });

        if (weatherRiskScore >= 50) {
            recommendations.push('Consider rescheduling non-critical outdoor work');
        }
        if (weatherRiskScore >= 75) {
            recommendations.push('Implement weather contingency plans');
            recommendations.push('Prepare for possible site evacuation');
        }

        return [...new Set(recommendations)]; // Remove duplicates
    }, [activeWeatherRisks, weatherRiskScore]);

    // Mock weather API call
    useEffect(() => {
        if (!enableRealTime || !projectLocation) return;

        const fetchWeatherData = async () => {
            setIsLoading(true);
            try {
                // Simulate API call delay
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Mock weather data based on location
                const mockWeatherData: WeatherData = {
                    location: projectLocation,
                    current: {
                        temperature: 85 + Math.random() * 20, // 85-105°F
                        humidity: 60 + Math.random() * 30, // 60-90%
                        windSpeed: 10 + Math.random() * 20, // 10-30 mph
                        windDirection: Math.random() * 360,
                        pressure: 29 + Math.random() * 2, // 29-31 inHg
                        visibility: 0.125 + Math.random() * 2, // 0.125-2 miles
                        conditions: ['Partly Cloudy', 'Mostly Cloudy', 'Overcast'][Math.floor(Math.random() * 3)],
                        timestamp: new Date()
                    },
                    forecast: Array.from({ length: 7 }, (_, i) => ({
                        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
                        high: 85 + Math.random() * 25,
                        low: 65 + Math.random() * 15,
                        conditions: ['Sunny', 'Cloudy', 'Rainy', 'Stormy'][Math.floor(Math.random() * 4)],
                        precipitation: Math.random() * 2,
                        windSpeed: 5 + Math.random() * 25
                    })),
                    alerts: [],
                    riskAssessment: {
                        overall: 0,
                        factors: [],
                        recommendations: []
                    }
                };

                setWeatherData(mockWeatherData);
            } catch (error) {
                console.error('Failed to fetch weather data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeatherData();

        // Set up real-time updates (every 5 minutes)
        const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [projectLocation, enableRealTime]);

    // Notify parent of risk updates
    useEffect(() => {
        onRiskUpdate?.(activeWeatherRisks);
    }, [activeWeatherRisks, onRiskUpdate]);

    const getRiskLevelColor = (score: number): string => {
        if (score >= 75) return '#dc2626'; // red
        if (score >= 50) return '#f59e0b'; // amber
        if (score >= 25) return '#fbbf24'; // yellow
        return '#10b981'; // green
    };

    const getSeverityColor = (severity: WeatherCondition['severity']): string => {
        switch (severity) {
            case 'extreme':
                return '#dc2626';
            case 'high':
                return '#ef4444';
            case 'medium':
                return '#f59e0b';
            case 'low':
                return '#10b981';
            default:
                return '#6b7280';
        }
    };

    return (
        <div className="weather-integration-service">
            {/* Header */}
            <div className="weather-header">
                <div className="header-content">
                    <div className="header-title">
                        <Cloud className="weather-icon" />
                        <h3>Weather Risk Assessment</h3>
                    </div>
                    <div className="header-location">
                        <MapPin size={16} />
                        <span>{projectLocation?.name || 'No location set'}</span>
                    </div>
                </div>

                {/* Overall Risk Score */}
                <div className="risk-score-display">
                    <div className="score-circle" style={{ borderColor: getRiskLevelColor(weatherRiskScore) }}>
                        <span className="score-value">{weatherRiskScore}</span>
                        <span className="score-label">Risk Score</span>
                    </div>
                    <div className="risk-trend">
                        <TrendingUp size={16} />
                        <span>Updated {weatherData?.current.timestamp.toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="weather-loading">
                    <div className="loading-spinner"></div>
                    <span>Fetching weather data...</span>
                </div>
            )}

            {/* Weather Conditions Grid */}
            {!isLoading && weatherData && (
                <div className="weather-conditions">
                    <div className="conditions-header">
                        <h4>Active Weather Risks</h4>
                        <span className="risk-count">{activeWeatherRisks.length} conditions detected</span>
                    </div>

                    <div className="conditions-grid">
                        {weatherConditions.map((condition) => {
                            const isActive = activeWeatherRisks.some((r) => r.id === condition.id);
                            const severityColor = getSeverityColor(condition.severity);

                            return (
                                <div
                                    key={condition.id}
                                    className={`condition-card ${isActive ? 'active' : 'inactive'}`}
                                    style={{ borderLeftColor: severityColor }}
                                    onClick={() => setSelectedCondition(condition)}
                                >
                                    <div className="condition-header">
                                        <div className="condition-icon">{condition.icon}</div>
                                        <div className="condition-info">
                                            <h5>{condition.description}</h5>
                                            <div className="condition-severity" style={{ color: severityColor }}>
                                                {condition.severity.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="condition-metrics">
                                        <div className="metric">
                                            <span className="metric-label">Current:</span>
                                            <span className="metric-value">
                                                {condition.currentValue !== undefined
                                                    ? `${condition.currentValue}${condition.unit}`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Threshold:</span>
                                            <span className="metric-value critical">
                                                {condition.threshold.critical}
                                                {condition.unit}
                                            </span>
                                        </div>
                                    </div>

                                    {isActive && (
                                        <div className="condition-impacts">
                                            <div className="impact-section">
                                                <h6>Operational Impact</h6>
                                                <ul>
                                                    {condition.impact.operations.map((impact, index) => (
                                                        <li key={index}>{impact}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="impact-section">
                                                <h6>Safety Impact</h6>
                                                <ul>
                                                    {condition.impact.safety.map((impact, index) => (
                                                        <li key={index}>{impact}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="impact-section">
                                                <h6>Schedule Impact</h6>
                                                <ul>
                                                    {condition.impact.schedule.map((impact, index) => (
                                                        <li key={index}>{impact}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Current Weather Summary */}
            {!isLoading && weatherData && (
                <div className="current-weather">
                    <h4>Current Conditions</h4>
                    <div className="weather-summary">
                        <div className="summary-item">
                            <Thermometer size={20} />
                            <div>
                                <span className="summary-label">Temperature</span>
                                <span className="summary-value">{Math.round(weatherData.current.temperature)}°F</span>
                            </div>
                        </div>

                        <div className="summary-item">
                            <Wind size={20} />
                            <div>
                                <span className="summary-label">Wind</span>
                                <span className="summary-value">{Math.round(weatherData.current.windSpeed)} mph</span>
                            </div>
                        </div>

                        <div className="summary-item">
                            <CloudRain size={20} />
                            <div>
                                <span className="summary-label">Humidity</span>
                                <span className="summary-value">{Math.round(weatherData.current.humidity)}%</span>
                            </div>
                        </div>

                        <div className="summary-item">
                            <span className="summary-label">Conditions</span>
                            <span className="summary-value">{weatherData.current.conditions}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Risk Recommendations */}
            {!isLoading && riskRecommendations.length > 0 && (
                <div className="risk-recommendations">
                    <h4>Safety Recommendations</h4>
                    <div className="recommendations-list">
                        {riskRecommendations.map((recommendation, index) => (
                            <div key={index} className="recommendation-item">
                                <AlertTriangle size={16} className="recommendation-icon" />
                                <span>{recommendation}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailed Condition Modal */}
            {selectedCondition && (
                <div className="condition-modal">
                    <div className="modal-overlay" onClick={() => setSelectedCondition(null)}></div>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{selectedCondition.description}</h3>
                            <button className="close-btn" onClick={() => setSelectedCondition(null)}>
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="condition-details">
                                <div className="detail-row">
                                    <label>Type:</label>
                                    <span>{selectedCondition.type}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Severity:</label>
                                    <span style={{ color: getSeverityColor(selectedCondition.severity) }}>
                                        {selectedCondition.severity.toUpperCase()}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <label>Current Value:</label>
                                    <span>
                                        {selectedCondition.currentValue !== undefined
                                            ? `${selectedCondition.currentValue}${selectedCondition.unit}`
                                            : 'Not available'}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <label>Warning Threshold:</label>
                                    <span>
                                        {selectedCondition.threshold.warning}
                                        {selectedCondition.unit}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <label>Critical Threshold:</label>
                                    <span>
                                        {selectedCondition.threshold.critical}
                                        {selectedCondition.unit}
                                    </span>
                                </div>
                            </div>

                            <div className="impact-details">
                                <h5>Impact Analysis</h5>
                                <div className="impact-grid">
                                    <div className="impact-column">
                                        <h6>Operations</h6>
                                        <ul>
                                            {selectedCondition.impact.operations.map((impact, index) => (
                                                <li key={index}>{impact}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="impact-column">
                                        <h6>Safety</h6>
                                        <ul>
                                            {selectedCondition.impact.safety.map((impact, index) => (
                                                <li key={index}>{impact}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="impact-column">
                                        <h6>Schedule</h6>
                                        <ul>
                                            {selectedCondition.impact.schedule.map((impact, index) => (
                                                <li key={index}>{impact}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeatherIntegrationService;
