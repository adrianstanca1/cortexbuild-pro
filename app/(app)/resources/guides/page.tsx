import Link from 'next/link';

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Practical Construction Guides
          </h2>
          <Link href="/resources" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Resources
          </Link>
        </div>
        
        <p className="text-lg text-gray-600 mb-10 text-center">
          Step-by-step instructions and best practices for construction professionals
        </p>
        
        <div className="space-y-6">
          {/* Safety Guide */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Construction Safety Management Guide
              </h3>
              <p className="text-gray-600 mb-3">
                A comprehensive approach to creating and maintaining a safe work environment that protects your most valuable asset—your people.
              </p>
              <div className="space-y-4">
                <p className="font-medium text-gray-700 mb-1">What You'll Learn:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>OSHA compliance strategies that go beyond the basics</li>
                  <li>Creating a safety culture that engages every team member</li>
                  <li>Effective hazard identification and risk assessment techniques</li>
                  <li>Implementing safety technology that actually gets used</li>
                  <li>Measuring and improving your safety performance over time</li>
                </ul>
              </div>
              <Link href="/resources/guides/safety-management" className="mt-4 inline-block bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded">
                Read Guide →
              </Link>
            </div>
          </div>
          
          {/* Project Management Guide */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Construction Project Management Essentials
              </h3>
              <p className="text-gray-600 mb-3">
                Proven methods for delivering projects on time, on budget, and to the highest quality standards.
              </p>
              <div className="space-y-4">
                <p className="font-medium text-gray-700 mb-1">What You'll Learn:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Modern scheduling techniques that account for real-world variability</li>
                  <li>Resource optimization strategies for maximum efficiency</li>
                  <li>Quality control systems that prevent costly rework</li>
                  <li>Change order management that protects your margins</li>
                  <li>Client communication strategies that build trust and satisfaction</li>
                </ul>
              </div>
              <Link href="/resources/guides/project-management" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded">
                Read Guide →
              </Link>
            </div>
          </div>
          
          {/* Sustainable Construction Guide */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Sustainable Construction Practices
              </h3>
              <p className="text-gray-600 mb-3">
                Environmentally responsible building methods that benefit both your business and the planet.
              </p>
              <div className="space-y-4">
                <p className="font-medium text-gray-700 mb-1">What You'll Learn:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Material selection strategies for reduced environmental impact</li>
                  <li>Waste reduction techniques that save money and protect the environment</li>
                  <li>Energy-efficient building practices that lower operating costs</li>
                  <li>Water conservation strategies for construction sites</li>
                  <li>How to market your sustainable construction services effectively</li>
                </ul>
              </div>
              <Link href="/resources/guides/sustainable-construction" className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded">
                Read Guide →
              </Link>
            </div>
          </div>
          
          {/* Technology Adoption Guide */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Technology Adoption Roadmap for Contractors
              </h3>
              <p className="text-gray-600 mb-3">
                A practical guide to evaluating, selecting, and implementing construction technology that delivers real ROI.
              </p>
              <div className="space-y-4">
                <p className="font-medium text-gray-700 mb-1">What You'll Learn:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>How to assess your technology readiness and needs</li>
                  <li>Evaluating ROI for construction technology investments</li>
                  <li>Change management strategies for successful technology adoption</li>
                  <li>Training and upskilling your workforce for new technologies</li>
                  <li>Measuring success and optimizing your technology investments over time</li>
                </ul>
              </div>
              <Link href="/resources/guides/technology-adoption" className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded">
                Read Guide →
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            More guides coming soon. Have expertise to share? 
            <a href="#" className="text-blue-600 hover:underline">Contact us</a> about contributing a guide.
          </p>
        </div>
      </div>
    </div>
  );
}
