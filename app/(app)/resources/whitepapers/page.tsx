import Link from 'next/link';

export default function WhitepapersPage() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Construction Research Whitepapers
          </h2>
          <Link href="/resources" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Resources
          </Link>
        </div>
        
        <p className="text-lg text-gray-600 mb-10 text-center">
          In-depth analysis and research on the future of construction
        </p>
        
        <div className="space-y-8">
          {/* Whitepaper 1 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                The Future of Construction: 2026-2030
              </h3>
              <p className="text-gray-600 mb-3">
                A comprehensive analysis of the technological, economic, and environmental forces shaping the construction industry over the next decade.
              </p>
              <div className="space-y-4">
                <p className="font-medium text-gray-700 mb-1">Key Topics Covered:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Artificial Intelligence and Machine Learning Applications</li>
                  <li>Modular and Prefabricated Construction at Scale</li>
                  <li>Sustainable Building and Net-Zero Construction</li>
                  <li>Advanced Materials and Construction Techniques</li>
                  <li>Digital Twins and Internet of Things (IoT) Integration</li>
                  <li>Robotics and Automation in Construction</li>
                  <li>Resilient Infrastructure for Climate Change Adaptation</li>
                </ul>
              </div>
              <Link href="/resources/whitepapers/future-of-construction-2026-2030" className="mt-4 inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded">
                Read Whitepaper →
              </Link>
            </div>
          </div>
          
          {/* Whitepaper 2 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Construction Technology ROI: Measuring and Maximizing Your Investment
              </h3>
              <p className="text-gray-600 mb-3">
                A data-driven approach to evaluating construction technology investments and ensuring they deliver measurable business value.
              </p>
              <div className="space-y-4">
                <p className="font-medium text-gray-700 mb-1">Key Topics Covered:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Framework for calculating true ROI on construction technology</li>
                  <li>Identifying and measuring both tangible and intangible benefits</li>
                  <li>Strategies for optimizing technology investments over time</li>
                  <li>Common pitfalls to avoid when adopting new technology</li>
                  <li>How to build a business case for technology adoption</li>
                  <li>Working with finance teams to secure budget approval</li>
                </ul>
              </div>
              <Link href="/resources/whitepapers/construction-technology-roi" className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded">
                Read Whitepaper →
              </Link>
            </div>
          </div>
          
          {/* Whitepaper 3 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Supply Chain Resilience in Construction: Strategies for Uncertain Times
              </h3>
              <p className="text-gray-600 mb-3">
                Building resilient supply chains that can withstand disruptions and ensure project continuity.
              </p>
              <div className="space-y-4">
                <p className="font-medium text-gray-700 mb-1">Key Topics Covered:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Lessons learned from recent global supply chain disruptions</li>
                  <li>Diversification strategies for critical materials and equipment</li>
                  <li>Local sourcing and regional supply chain development</li>
                  <li>Inventory management strategies for construction projects</li>
                  <li>Supplier relationship management and collaboration</li>
                  <li>Technology solutions for supply chain visibility and tracking</li>
                  <li>Contractual strategies that enhance supply chain resilience</li>
                </ul>
              </div>
              <Link href="/resources/whitepapers/supply-chain-resilience" className="mt-4 inline-block bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded">
                Read Whitepaper →
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            More whitepapers coming soon. Have research to share? 
            <a href="#" className="text-blue-600 hover:underline">Contact us</a> about contributing a whitepaper.
          </p>
        </div>
      </div>
    </div>
  );
}
