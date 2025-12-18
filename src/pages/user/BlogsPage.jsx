import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MdArticle, MdCalendarToday, MdClose } from 'react-icons/md';
import DynamicSEO from '../../components/DynamicSEO';

const BlogsPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true) // Only fetch published blogs
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Inswinger+ Sports Blog",
    "description": "Latest sports news, analysis, and updates",
    "url": window.location.href,
    "blogPost": blogs.slice(0, 10).map(blog => ({
      "@type": "BlogPosting",
      "headline": blog.title,
      "datePublished": blog.created_at,
      "author": {
        "@type": "Organization",
        "name": "Inswinger+"
      },
      "url": `${window.location.origin}/blogs/${blog.slug || blog.id}`,
    })),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-100 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <DynamicSEO
        pageType="blog"
        title="Sports News & Analysis"
        content={blogs[0]?.content || 'Latest sports news, match analysis, expert opinions and trending stories from the world of sports'}
        sport={blogs[0]?.sport}
        fallbackTitle="Sports News & Blogs | Inswinger+"
        fallbackDescription="Read the latest sports news, match analysis, and expert opinions on Inswinger+. Stay updated with trending sports stories."
        fallbackKeywords="sports news, sports blog, football news, cricket updates, match analysis, sports opinions"
        canonical="/blogs"
        schema={schema}
        useAI={true}
      />
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-white mb-8">Sports News & Blogs</h1>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pl-12 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <MdArticle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <MdClose />
                </button>
              )}
            </div>
          </div>


          {/* Blogs Grid */}
          {filteredBlogs.length === 0 ? (
            <div className="text-center py-20">
              <MdArticle className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-xl">
                {searchTerm ? 'No blogs found matching your search' : 'No blogs available yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogs.map((blog) => {
                const previewText = stripHtml(blog.content || '').substring(0, 150);
                
                return (
                  <div 
                    key={blog.id} 
                    className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer group"
                    onClick={() => setSelectedBlog(blog)}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-purple-600 to-blue-600 overflow-hidden">
                      {blog.thumbnail ? (
                        <img 
                          src={blog.thumbnail} 
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MdArticle className="text-6xl text-white opacity-50" />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                            {blog.title}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MdCalendarToday />
                            {new Date(blog.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                        {previewText}...
                      </p>
                      
                      <button className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        Read More →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Blog Detail Modal */}
        {selectedBlog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <MdArticle className="text-3xl text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">{selectedBlog.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <MdCalendarToday />
                        {new Date(selectedBlog.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBlog(null)}
                  className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MdClose className="text-2xl" />
                </button>
              </div>

              <div className="prose prose-invert max-w-none">
                <div
                  className="text-gray-300 whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content || '' }}
                />
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <button
                  onClick={() => setSelectedBlog(null)}
                  className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
          {/* Stats */}
        <div className="mb-8 text-center">
            <p className="text-gray-400">
              Showing <span className="text-white font-semibold">{filteredBlogs.length}</span> of <span className="text-white font-semibold">{blogs.length}</span> blogs
            </p>
        </div>

      </div>
    </>
  );
};

export default BlogsPage;
