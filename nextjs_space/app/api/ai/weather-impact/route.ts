import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

const ABACUS_API_URL = 'https://api.abacus.ai/api/v0/chat';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

interface WeatherData {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
}

interface ScheduleImpact {
  date: string;
  impactLevel: 'none' | 'low' | 'medium' | 'high' | 'severe';
  affectedActivities: string[];
  recommendation: string;
  riskScore: number;
}

const weatherCodeDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

const getWeatherDescription = (code: number): string => {
  return weatherCodeDescriptions[code] || 'Unknown';
};

const calculateImpact = (weather: WeatherData): ScheduleImpact => {
  let riskScore = 0;
  const affectedActivities: string[] = [];
  let impactLevel: ScheduleImpact['impactLevel'] = 'none';
  let recommendation = 'Normal operations can continue.';

  // Temperature impacts
  if (weather.tempMax < 2 || weather.tempMin < -5) {
    riskScore += 30;
    affectedActivities.push('Concrete pouring', 'External rendering', 'Painting');
  }
  if (weather.tempMax > 30) {
    riskScore += 15;
    affectedActivities.push('Hot work operations', 'Roof work');
  }

  // Precipitation impacts
  if (weather.precipitation > 0 && weather.precipitation <= 2) {
    riskScore += 10;
    affectedActivities.push('External finishes');
  } else if (weather.precipitation > 2 && weather.precipitation <= 10) {
    riskScore += 30;
    affectedActivities.push('Groundworks', 'External work', 'Scaffolding');
  } else if (weather.precipitation > 10) {
    riskScore += 50;
    affectedActivities.push('All external activities', 'Excavation', 'Crane operations');
  }

  // Wind impacts
  if (weather.windSpeed > 10 && weather.windSpeed <= 20) {
    riskScore += 15;
    affectedActivities.push('Scaffolding erection', 'Material handling');
  } else if (weather.windSpeed > 20 && weather.windSpeed <= 35) {
    riskScore += 35;
    affectedActivities.push('Crane operations', 'Working at height', 'Scaffolding');
  } else if (weather.windSpeed > 35) {
    riskScore += 60;
    affectedActivities.push('All elevated work', 'All lifting operations', 'Tower crane');
  }

  // Snow/Ice impacts
  if ([71, 73, 75, 77, 85, 86].includes(weather.weatherCode)) {
    riskScore += 40;
    affectedActivities.push('All external work', 'Access routes', 'Material deliveries');
  }

  // Thunderstorm impacts
  if ([95, 96, 99].includes(weather.weatherCode)) {
    riskScore += 70;
    affectedActivities.push('All site operations', 'Electrical work', 'Working at height');
  }

  // Determine impact level
  if (riskScore >= 60) {
    impactLevel = 'severe';
    recommendation = 'Consider site shutdown. Prioritise safety and protection of materials.';
  } else if (riskScore >= 40) {
    impactLevel = 'high';
    recommendation = 'Suspend affected activities. Focus on internal work and site protection.';
  } else if (riskScore >= 20) {
    impactLevel = 'medium';
    recommendation = 'Monitor conditions closely. Have contingency plans ready.';
  } else if (riskScore > 0) {
    impactLevel = 'low';
    recommendation = 'Minor adjustments may be needed. Brief teams on conditions.';
  }

  return {
    date: weather.date,
    impactLevel,
    affectedActivities: [...new Set(affectedActivities)],
    recommendation,
    riskScore: Math.min(riskScore, 100),
  };
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const days = parseInt(searchParams.get('days') || '14');

    // Get project location or use default (London)
    const latitude = 51.5074;
    const longitude = -0.1278;
    let locationName = 'London, UK';

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId: session.user.organizationId!,
        },
      });
      if (project?.location) {
        locationName = project.location;
        // For demo, use London coordinates. In production, geocode the location
      }
    }

    // Fetch weather forecast from Open-Meteo
    const weatherUrl = `${OPEN_METEO_URL}?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code&timezone=Europe/London&forecast_days=${days}`;
    
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await weatherResponse.json();
    const daily = weatherData.daily;

    // Process weather data
    const forecast: WeatherData[] = daily.time.map((date: string, index: number) => ({
      date,
      tempMax: daily.temperature_2m_max[index],
      tempMin: daily.temperature_2m_min[index],
      precipitation: daily.precipitation_sum[index],
      windSpeed: daily.wind_speed_10m_max[index],
      weatherCode: daily.weather_code[index],
      description: getWeatherDescription(daily.weather_code[index]),
    }));

    // Calculate impacts
    const impacts: ScheduleImpact[] = forecast.map(calculateImpact);

    // Get upcoming tasks if project specified
    let upcomingTasks: { id: string; title: string; dueDate: Date | null }[] = [];
    if (projectId) {
      upcomingTasks = await prisma.task.findMany({
        where: {
          projectId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          },
        },
        select: { id: true, title: true, dueDate: true },
        take: 20,
      });
    }

    // Calculate summary statistics
    const severeDays = impacts.filter(i => i.impactLevel === 'severe').length;
    const highDays = impacts.filter(i => i.impactLevel === 'high').length;
    const mediumDays = impacts.filter(i => i.impactLevel === 'medium').length;
    const avgRiskScore = Math.round(impacts.reduce((a, b) => a + b.riskScore, 0) / impacts.length);

    return NextResponse.json({
      success: true,
      location: locationName,
      forecast,
      impacts,
      upcomingTasks,
      summary: {
        totalDays: days,
        severeDays,
        highDays,
        mediumDays,
        goodDays: days - severeDays - highDays - mediumDays,
        avgRiskScore,
        recommendation: severeDays > 2 ? 'Significant weather disruption expected. Review project schedule.' :
          highDays > 3 ? 'Multiple high-impact days ahead. Prepare contingency plans.' :
          'Generally favourable conditions. Minor adjustments may be needed.',
      },
    });
  } catch (error) {
    console.error('Error fetching weather impact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, forecast, impacts, upcomingTasks } = body;

    // Prepare context for AI analysis
    const context = {
      forecast: forecast.slice(0, 14),
      impacts: impacts.slice(0, 14),
      upcomingTasks: upcomingTasks?.slice(0, 10) || [],
      highImpactDays: impacts.filter((i: ScheduleImpact) => i.impactLevel === 'high' || i.impactLevel === 'severe'),
    };

    const prompt = `As a UK construction weather impact analyst, analyze this weather forecast and its impact on construction activities:

${JSON.stringify(context, null, 2)}

Provide:
1. Executive Summary (2-3 sentences)
2. Critical Weather Windows (specific dates/times to avoid)
3. Recommended Schedule Adjustments
4. Activity-Specific Guidance:
   - Concrete works
   - External cladding/rendering
   - Groundworks/excavation
   - Crane operations
   - Working at height
   - Material deliveries
5. Safety Considerations
6. Cost Implications (potential overtime, delays, protection costs)
7. Mitigation Strategies
8. Task Rescheduling Recommendations (based on the upcoming tasks provided)
9. Week-by-Week Work Plan Suggestion

Use UK construction terminology. Be specific about dates and activities.`;

    const response = await fetch(ABACUS_APIURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUS_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a UK construction weather impact specialist. Provide practical, actionable advice for managing weather-related construction risks. Reference UK HSE guidelines and construction best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Abacus API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to analyze weather impact' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || data.content || '';

    return NextResponse.json({
      success: true,
      analysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weather impact analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
