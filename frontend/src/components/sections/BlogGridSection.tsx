import React from 'react';

export interface BlogItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishDate: string;
  authorName: string;
  imageUrl?: string;
  categoryName?: string;
}

export interface BlogGridSectionProps {
  sectionTitle?: string;
  blogs?: BlogItem[];
  postsPerPage?: number;
  showAuthor?: boolean;
  showDate?: boolean;
}

const MOCK_BLOGS: BlogItem[] = [
  {
    id: "1",
    slug: "how-to-become-a-graphic-designer",
    title: "How to Become a Graphic Designer",
    excerpt: "Learn the core skills, design principles, and career pathways required to become a professional graphic designer in 2026.",
    publishDate: "December 28, 2023",
    authorName: "Onecontributor",
    imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
    categoryName: "Design"
  },
  {
    id: "2",
    slug: "how-to-add-transitions-in-premiere-pro",
    title: "How to Add Transitions in Premiere Pro",
    excerpt: "Discover the step-by-step guide to adding video transitions, customizing durations, and optimizing video editing flow.",
    publishDate: "December 24, 2023",
    authorName: "Onecontributor",
    imageUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
    categoryName: "Development"
  },
  {
    id: "3",
    slug: "how-to-create-ai-art-your-ultimate-guide",
    title: "How to Create AI Art: Your Ultimate Guide",
    excerpt: "A complete walkthrough on generating stunning art using modern AI tools, prompt configurations, and style controls.",
    publishDate: "December 20, 2023",
    authorName: "Onecontributor",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80",
    categoryName: "Marketing"
  }
];

export const BlogGridSection: React.FC<BlogGridSectionProps> = ({
  sectionTitle = "Upskill Blog",
  blogs = MOCK_BLOGS,
  postsPerPage = 3,
  showAuthor = true,
  showDate = true,
}) => {
  const visibleBlogs = blogs.slice(0, postsPerPage);

  return (
    <div className="elementor-element elementor-element-blog-section e-flex e-con-boxed e-con e-parent" style={{ margin: '40px 0' }}>
      <div className="e-con-inner">
        {sectionTitle && (
          <div className="elementor-element elementor-widget elementor-widget-heading" style={{ marginBottom: '25px', width: '100%' }}>
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default" style={{ color: '#fff', fontSize: '28px', margin: 0 }}>
                {sectionTitle}
              </h2>
            </div>
          </div>
        )}

        <div 
          className="blog-grid-container elementor-posts-container elementor-posts elementor-posts--skin-classic elementor-grid" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '30px', 
            width: '100%' 
          }}
        >
          {visibleBlogs.map((blog) => (
            <article 
              key={blog.id} 
              className="elementor-post elementor-grid-item" 
              style={{ 
                background: '#1F233E', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                display: 'flex', 
                flexDirection: 'column',
                border: '1px solid rgba(255,255,255,0.03)'
              }}
            >
              {/* Blog Image */}
              {blog.imageUrl && (
                <div className="blog-post-thumbnail" style={{ height: '200px', overflow: 'hidden' }}>
                  <a href={`/blog/${blog.slug}`}>
                    <img 
                      src={blog.imageUrl} 
                      alt={blog.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                      className="blog-img"
                    />
                  </a>
                </div>
              )}

              {/* Blog Details content */}
              <div className="elementor-post__text" style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                
                {/* Meta details */}
                <div className="elementor-post__meta-data" style={{ display: 'flex', gap: '15px', fontSize: '13px', opacity: 0.7, marginBottom: '12px', color: '#eee' }}>
                  {showAuthor && (
                    <span className="elementor-post-author" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="jki jki-user-circle-solid" style={{ color: '#4caf50' }}></i>
                      {blog.authorName}
                    </span>
                  )}
                  {showDate && (
                    <span className="elementor-post-date" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="jki jki-calendar-solid"></i>
                      {blog.publishDate}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="elementor-post__title" style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold', lineHeight: '1.4' }}>
                  <a href={`/blog/${blog.slug}`} style={{ color: '#fff', textDecoration: 'none' }}>
                    {blog.title}
                  </a>
                </h3>

                {/* Excerpt */}
                <p style={{ color: '#eee', opacity: 0.8, fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0', flexGrow: 1 }}>
                  {blog.excerpt}
                </p>

                {/* Read More */}
                <a 
                  className="elementor-post__read-more" 
                  href={`/blog/${blog.slug}`} 
                  style={{ color: '#4caf50', textDecoration: 'none', fontWeight: '600', fontSize: '14px', marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Read More »
                </a>

              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogGridSection;
