/**
 * Onboarding Page
 * Guided setup for new organizations
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Building2, Users, Settings, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  component: React.ReactNode
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [organizationData, setOrganizationData] = useState({
    name: '',
    description: '',
    industry: '',
  })
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to ConstructAI',
      description: 'Let\'s get your organization set up',
      icon: <Sparkles className="w-8 h-8" />,
      component: (
        <div className="space-y-4">
          <p className="text-gray-300">
            ConstructAI is a comprehensive construction management platform with AI-driven automation.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <FeatureCard
              title="AI Agents"
              description="9 specialized AI agents for automation"
            />
            <FeatureCard
              title="Field Operations"
              description="Offline-capable mobile app"
            />
            <FeatureCard
              title="Real-Time Sync"
              description="Live updates across all devices"
            />
            <FeatureCard
              title="Analytics"
              description="Predictive insights and reporting"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'organization',
      title: 'Organization Setup',
      description: 'Tell us about your company',
      icon: <Building2 className="w-8 h-8" />,
      component: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Company Name</label>
            <input
              type="text"
              value={organizationData.name}
              onChange={(e) =>
                setOrganizationData({ ...organizationData, name: e.target.value })
              }
              placeholder="Acme Construction Ltd"
              className="w-full p-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Description</label>
            <textarea
              value={organizationData.description}
              onChange={(e) =>
                setOrganizationData({ ...organizationData, description: e.target.value })
              }
              placeholder="Brief description of your company..."
              className="w-full p-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Industry</label>
            <select
              value={organizationData.industry}
              onChange={(e) =>
                setOrganizationData({ ...organizationData, industry: e.target.value })
              }
              className="w-full p-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select industry</option>
              <option value="commercial">Commercial Construction</option>
              <option value="residential">Residential Construction</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      id: 'team',
      title: 'Add Team Members',
      description: 'Invite your team to the platform',
      icon: <Users className="w-8 h-8" />,
      component: (
        <div className="space-y-4">
          <p className="text-gray-300">
            You can add team members now or skip and do it later from the Team Management page.
          </p>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">
              Team management features are available after setup completion.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'settings',
      title: 'Configure Settings',
      description: 'Customize your platform preferences',
      icon: <Settings className="w-8 h-8" />,
      component: (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Enable email notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Enable SMS notifications for emergencies</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Enable AI agent automation</span>
            </label>
          </div>
        </div>
      ),
    },
  ]

  const handleNext = () => {
    const step = steps[currentStep]
    if (step.id === 'organization' && !organizationData.name) {
      toast.error('Please enter your company name')
      return
    }

    setCompletedSteps([...completedSteps, step.id])

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    try {
      // Create organization (would call API)
      toast.success('Organization setup complete!')
      navigate('/dashboard')
    } catch (error) {
      toast.error('Setup failed. Please try again.')
    }
  }

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-gray-800 rounded-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-primary-600 rounded-lg">
              {currentStepData.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
              <p className="text-gray-400">{currentStepData.description}</p>
            </div>
          </div>

          <div className="mb-6">{currentStepData.component}</div>

          {/* Step Indicators */}
          <div className="flex gap-2 mb-6">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex-1 h-1 rounded ${
                  idx <= currentStep ? 'bg-primary-600' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <div className="flex gap-2">
              {currentStep < steps.length - 1 && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Completed Steps Summary */}
        {completedSteps.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">Completed Steps</h3>
            <div className="flex flex-wrap gap-2">
              {completedSteps.map((stepId) => {
                const step = steps.find((s) => s.id === stepId)
                return (
                  <div
                    key={stepId}
                    className="flex items-center gap-1 px-2 py-1 bg-green-600 bg-opacity-20 rounded text-xs"
                  >
                    <CheckCircle className="w-3 h-3" />
                    {step?.title}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 bg-gray-700 rounded-lg">
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  )
}

