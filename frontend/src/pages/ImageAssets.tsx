import React from 'react';

export const TESTIMONIAL_AVATAR_ONE = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=96&q=80';
export const TESTIMONIAL_AVATAR_TWO = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&q=80';
export const TESTIMONIAL_AVATAR_THREE = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&q=80';

const ImageAssets: React.FC = () => {
  return (
    <div className="image-assets-page" style={{ padding: '40px 20px', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Stored Testimonial Images</h1>
      <p style={{ marginBottom: '30px', color: '#374151' }}>
        These image URLs are centrally stored on this page and reused across the homepage testimonial section.
      </p>
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: '#ffffff' }}>
          <img src={TESTIMONIAL_AVATAR_ONE} alt="Testimonial avatar 1" style={{ width: '100%', height: 'auto', borderRadius: '12px' }} />
          <p style={{ marginTop: '12px', fontWeight: 600 }}>Avatar 1</p>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: '#ffffff' }}>
          <img src={TESTIMONIAL_AVATAR_TWO} alt="Testimonial avatar 2" style={{ width: '100%', height: 'auto', borderRadius: '12px' }} />
          <p style={{ marginTop: '12px', fontWeight: 600 }}>Avatar 2</p>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: '#ffffff' }}>
          <img src={TESTIMONIAL_AVATAR_THREE} alt="Testimonial avatar 3" style={{ width: '100%', height: 'auto', borderRadius: '12px' }} />
          <p style={{ marginTop: '12px', fontWeight: 600 }}>Avatar 3</p>
        </div>
      </div>
    </div>
  );
};

export default ImageAssets;
