'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, 
  Thermometer, AlertTriangle, CloudFog, Loader2 
} from 'lucide-react';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  precipitation: number;
  uvIndex?: number;
}

interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  precipProbability: number;
}

interface WeatherWidgetProps {
  location?: string;
  latitude?: number;
  longitude?: number;
  compact?: boolean;
  showForecast?: boolean;
}

const weatherDescriptions: Record<number, { label: string; icon: React.ElementType; color: string }> = {
  0: { label: 'Clear', icon: Sun, color: 'text-yellow-500' },
  1: { label: 'Mainly Clear', icon: Sun, color: 'text-yellow-500' },
  2: { label: 'Partly Cloudy', icon: Cloud, color: 'text-gray-500' },
  3: { label: 'Overcast', icon: Cloud, color: 'text-gray-600' },
  45: { label: 'Foggy', icon: CloudFog, color: 'text-gray-400' },
  48: { label: 'Rime Fog', icon: CloudFog, color: 'text-gray-400' },
  51: { label: 'Light Drizzle', icon: CloudRain, color: 'text-blue-400' },
  53: { label: 'Drizzle', icon: CloudRain, color: 'text-blue-500' },
  55: { label: 'Heavy Drizzle', icon: CloudRain, color: 'text-blue-600' },
  61: { label: 'Light Rain', icon: CloudRain, color: 'text-blue-400' },
  63: { label: 'Rain', icon: CloudRain, color: 'text-blue-500' },
  65: { label: 'Heavy Rain', icon: CloudRain, color: 'text-blue-600' },
  66: { label: 'Freezing Rain', icon: CloudSnow, color: 'text-cyan-500' },
  67: { label: 'Heavy Freezing Rain', icon: CloudSnow, color: 'text-cyan-600' },
  71: { label: 'Light Snow', icon: CloudSnow, color: 'text-blue-200' },
  73: { label: 'Snow', icon: CloudSnow, color: 'text-blue-300' },
  75: { label: 'Heavy Snow', icon: CloudSnow, color: 'text-blue-400' },
  77: { label: 'Snow Grains', icon: CloudSnow, color: 'text-blue-300' },
  80: { label: 'Light Showers', icon: CloudRain, color: 'text-blue-400' },
  81: { label: 'Showers', icon: CloudRain, color: 'text-blue-500' },
  82: { label: 'Heavy Showers', icon: CloudRain, color: 'text-blue-600' },
  85: { label: 'Snow Showers', icon: CloudSnow, color: 'text-blue-300' },
  86: { label: 'Heavy Snow Showers', icon: CloudSnow, color: 'text-blue-400' },
  95: { label: 'Thunderstorm', icon: CloudRain, color: 'text-purple-500' },
  96: { label: 'Thunderstorm + Hail', icon: CloudRain, color: 'text-purple-600' },
  99: { label: 'Severe Thunderstorm', icon: CloudRain, color: 'text-purple-700' },
};

const getWeatherInfo = (code: number) => {
  return weatherDescriptions[code] || { label: 'Unknown', icon: Cloud, color: 'text-gray-500' };
};

const isWeatherSuitableForWork = (data: WeatherData): { suitable: boolean; reason?: string } => {
  if (data.windSpeed > 40) return { suitable: false, reason: 'High winds - unsafe for elevated work' };
  if (data.weatherCode >= 95) return { suitable: false, reason: 'Thunderstorm - suspend outdoor work' };
  if (data.weatherCode >= 65 && data.weatherCode <= 67) return { suitable: false, reason: 'Heavy rain/freezing rain' };
  if (data.weatherCode >= 73 && data.weatherCode <= 77) return { suitable: false, reason: 'Heavy snow conditions' };
  if (data.temperature < -10) return { suitable: false, reason: 'Extreme cold - limit exposure' };
  if (data.temperature > 35) return { suitable: false, reason: 'Extreme heat - frequent breaks needed' };
  if (data.uvIndex && data.uvIndex >= 8) return { suitable: true, reason: 'High UV - sun protection required' };
  return { suitable: true };
};

export function WeatherWidget({ location, latitude, longitude, compact = false, showForecast = true }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    latitude && longitude ? { lat: latitude, lon: longitude } : null
  );

  // Geocode location if coordinates not provided
  useEffect(() => {
    if (coords) return;
    if (!location) {
      setError('No location provided');
      setLoading(false);
      return;
    }

    const geocode = async () => {
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setCoords({ lat: data.results[0].latitude, lon: data.results[0].longitude });
        } else {
          setError('Location not found');
          setLoading(false);
        }
      } catch {
        setError('Failed to geocode location');
        setLoading(false);
      }
    };

    geocode();
  }, [location, coords]);

  // Fetch weather data
  useEffect(() => {
    if (!coords) return;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`
        );
        const data = await response.json();

        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day === 1,
          precipitation: data.current.precipitation,
          uvIndex: data.current.uv_index,
        });

        if (data.daily) {
          const days: ForecastDay[] = data.daily.time.slice(1, 5).map((date: string, i: number) => ({
            date,
            maxTemp: Math.round(data.daily.temperature_2m_max[i + 1]),
            minTemp: Math.round(data.daily.temperature_2m_min[i + 1]),
            weatherCode: data.daily.weather_code[i + 1],
            precipProbability: data.daily.precipitation_probability_max[i + 1],
          }));
          setForecast(days);
        }

        setError(null);
      } catch {
        setError('Failed to fetch weather');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000); // Refresh every 30 minutes
    return () => clearInterval(interval);
  }, [coords]);

  if (loading) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className="py-4 text-center text-muted-foreground">
          <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{error || 'Weather unavailable'}</p>
        </CardContent>
      </Card>
    );
  }

  const weatherInfo = getWeatherInfo(weather.weatherCode);
  const WeatherIcon = weatherInfo.icon;
  const workStatus = isWeatherSuitableForWork(weather);

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <WeatherIcon className={`h-8 w-8 ${weatherInfo.color}`} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{weather.temperature}°C</span>
            <span className="text-sm text-muted-foreground">{weatherInfo.label}</span>
          </div>
          {!workStatus.suitable && (
            <Badge variant="destructive" className="text-xs mt-1">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {workStatus.reason}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Site Weather</span>
          {location && <span className="text-xs text-muted-foreground font-normal">{location}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Weather */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <WeatherIcon className={`h-12 w-12 ${weatherInfo.color}`} />
            <div>
              <div className="text-3xl font-bold">{weather.temperature}°C</div>
              <div className="text-sm text-muted-foreground">{weatherInfo.label}</div>
            </div>
          </div>
          <div className="text-right text-sm space-y-1">
            <div className="flex items-center gap-1 justify-end">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <span>Feels {weather.feelsLike}°C</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span>{weather.humidity}% humidity</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Wind className="h-4 w-4 text-gray-500" />
              <span>{weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>

        {/* Work Status Alert */}
        <div className={`p-3 rounded-lg mb-4 ${workStatus.suitable ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex items-center gap-2">
            {workStatus.suitable ? (
              <Badge variant="default" className="bg-green-600">
                ✓ Good conditions for work
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {workStatus.reason}
              </Badge>
            )}
          </div>
        </div>

        {/* 4-Day Forecast */}
        {showForecast && forecast.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">4-Day Forecast</div>
            <div className="grid grid-cols-4 gap-2">
              {forecast.map((day) => {
                const dayInfo = getWeatherInfo(day.weatherCode);
                const DayIcon = dayInfo.icon;
                const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div key={day.date} className="text-center p-2 bg-muted/30 rounded-lg">
                    <div className="text-xs font-medium">{dayName}</div>
                    <DayIcon className={`h-5 w-5 mx-auto my-1 ${dayInfo.color}`} />
                    <div className="text-xs">
                      <span className="font-medium">{day.maxTemp}°</span>
                      <span className="text-muted-foreground">/{day.minTemp}°</span>
                    </div>
                    {day.precipProbability > 30 && (
                      <div className="text-xs text-blue-500">{day.precipProbability}%</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
