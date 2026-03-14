import Link from 'next/link';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Construction Resources Library
        </h1>
        <p className="text-xl text-gray-600 text-center mb-12">
          Downloadable guides, case studies, whitepapers, and tools to help you succeed in the construction industry
        </p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Case Studies */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Case Studies
              </h2>
              <p className="text-gray-600 mb-4">
                Real-world examples of how construction companies are overcoming challenges and achieving remarkable results with modern technology and best practices.
              </p>
              <Link href="/resources/case-studies" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded">
                Explore Case Studies →
              </Link>
            </div>
          </div>
          
          {/* Guides */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Practical Guides
              </h2>
              <p className="text-gray-600 mb-4">
                Step-by-step instructions and best practices for everything from safety management to sustainable construction techniques.
              </p>
              <Link href="/resources/guides" className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded">
                Explore Guides →
              </Link>
            </div>
          </div>
          
          {/* Whitepapers */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Research Whitepapers
              </h2>
              <p className="text-gray-600 mb-4">
                In-depth analysis and research on emerging trends, technologies, and methodologies shaping the future of construction.
              </p>
              <Link href="/resources/whitepapers" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded">
                Explore Whitepapers →
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <Link href="/blog" className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
            Read Our Latest Blog Posts
          </Link>
        </div>
      </div>
    </div>
  );
}
