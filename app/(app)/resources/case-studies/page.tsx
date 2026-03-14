import Link from 'next/link';

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Construction Case Studies
          </h2>
          <Link href="/resources" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Resources
          </Link>
        </div>
        
        <p className="text-lg text-gray-600 mb-10 text-center">
          Real-world examples of construction companies achieving excellence through innovation, technology, and best practices
        </p>
        
        <div className="space-y-8">
          {/* Case Study 1 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm overflow-hidden border border-blue-100">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 flex justify-between items-center">
                <span>High-Rise Concrete Construction Optimization</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Case Study</span>
              </h3>
              <p className="text-gray-600 mb-3">
                A mid-sized concrete contractor reduced project timelines by 22% and cut labor costs by 18% through the implementation of AI-powered scheduling and real-time progress tracking.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Location:</div>
                  <div className="text-gray-600">Downtown Metropolitan Area</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Project Value:</div>
                  <div className="text-gray-600">$42M</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Duration:</div>
                  <div className="text-gray-600">14 months → 11 months</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">ROI:</div>
                  <div className="text-gray-600">340% in first year</div>
                </div>
              </div>
              <Link href="/resources/case-studies/high-rise-concrete-optimization" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded">
                Read Full Case Study →
              </Link>
            </div>
          </div>
          
          {/* Case Study 2 */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm overflow-hidden border border-green-100">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 flex justify-between items-center">
                <span>Sustainable Renovation: Historic Building Retrofit</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Case Study</span>
              </h3>
              <p className="text-gray-600 mb-3">
                A specialty renovation contractor achieved LEED Gold certification and reduced waste by 75% on a historic building retrofit through sustainable material selection and advanced waste tracking systems.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Location:</div>
                  <div className="text-gray-600">Historic District</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Certification:</div>
                  <div className="text-gray-600">LEED Gold</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Waste Reduction:</div>
                  <div className="text-gray-600">75%</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Energy Savings:</div>
                  <div className="text-gray-600">40% reduction</div>
                </div>
              </div>
              <Link href="/resources/case-studies/historic-building-retrofit" className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded">
                Read Full Case Study →
              </Link>
            </div>
          </div>
          
          {/* Case Study 3 */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-sm overflow-hidden border border-purple-100">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 flex justify-between items-center">
                <span>Modular Healthcare Facility Construction</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Case Study</span>
              </h3>
              <p className="text-gray-600 mb-3">
                A healthcare construction specialist delivered a 60,000 sq ft medical facility 40% faster than traditional methods using prefabricated modular components with integrated MEP systems.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Location:</div>
                  <div className="text-gray-600">Suburban Medical Campus</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Facility Size:</div>
                  <div className="text-gray-600">60,000 sq ft</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Speed Improvement:</div>
                  <div className="text-gray-600">40% faster</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Cost Predictability:</div>
                  <div className="text-gray-600">95% on budget</div>
                </div>
              </div>
              <Link href="/resources/case-studies/modular-healthcare-facility" className="mt-4 inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded">
                Read Full Case Study →
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            More case studies coming soon. Have a success story to share? 
            <a href="#" className="text-blue-600 hover:underline">Contact us</a> to contribute.
          </p>
        </div>
      </div>
    </div>
  );
}
