import Link from 'next/link';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Construction Insights Blog
        </h1>
        
        <div className="space-y-6">
          {/* Blog posts will be dynamically generated from CMS/database */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <Link href="/blog/construction-industry-trends-2026" className="block">
              <div className="flex items-start p-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl">📈</span>
                  </div>
                </div>
                <div className="ml-4 flex-1 space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Construction Industry Trends 2026: What Contractors Need to Know
                  </h2>
                  <p className="text-gray-600 line-clamp-3">
                    Explore the latest trends shaping the construction industry, from AI-powered project management to sustainable building practices and modular construction innovations.
                  </p>
                  <div className="flex items-center text-sm text-blue-600">
                    <span>Mar 15, 2026</span>
                    <span className="mx-2">•</span>
                    <span>5 min read</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <Link href="/blog/ai-in-construction-benefits" className="block">
              <div className="flex items-start p-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl">🤖</span>
                  </div>
                </div>
                <div className="ml-4 flex-1 space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    How AI is Transforming Construction: Real Benefits for Contractors
                  </h2>
                  <p className="text-gray-600 line-clamp-3">
                    Discover practical applications of AI in construction that are delivering measurable ROI through improved scheduling, risk reduction, and quality control.
                  </p>
                  <div className="flex items-center text-sm text-green-600">
                    <span>Mar 10, 2026</span>
                    <span className="mx-2">•</span>
                    <span>7 min read</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <Link href="/blog/safety-technology-advances" className="block">
              <div className="flex items-start p-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl">🛡️</span>
                  </div>
                </div>
                <div className="ml-4 flex-1 space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Latest Safety Technology Advances Protecting Construction Workers
                  </h2>
                  <p className="text-gray-600 line-clamp-3">
                    From wearable sensors to AI-powered hazard detection, new technologies are making construction sites safer than ever before.
                  </p>
                  <div className="flex items-center text-sm text-red-600">
                    <span>Mar 5, 2026</span>
                    <span className="mx-2">•</span>
                    <span>6 min read</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/resources" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
            Explore All Resources
          </Link>
        </div>
      </div>
    </div>
  );
}
