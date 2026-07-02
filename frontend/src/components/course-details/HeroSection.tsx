import React from 'react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  rating: number;
  totalRatings: number;
  students: number;
  instructor: string;
  lastUpdated: string;
  language: string;
  category: string;
  level: string;
  duration: string;
  tags: string[];
  price: number;
  oldPrice: number;
  imageUrl: string;
  thumbnailUrl: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ title, subtitle, rating, totalRatings, students, instructor, lastUpdated, language, category, level, duration, tags, price, oldPrice, imageUrl, thumbnailUrl }) => {
  return (
    <section className="grid gap-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
      <div className="space-y-6">
        <nav className="text-sm font-medium text-slate-500" aria-label="Breadcrumb">
          <span className="text-sky-600">Home</span>
          <span className="mx-2">/</span>
          <span className="text-sky-600">Courses</span>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{title}</span>
        </nav>
        <div className="space-y-4">
          <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">Premium course</div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          <p className="max-w-2xl text-lg text-slate-600">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 font-semibold text-amber-600">
            <span>★</span>
            <span>{rating.toFixed(1)}</span>
          </div>
          <span>{totalRatings.toLocaleString()} ratings</span>
          <span>{students.toLocaleString()} students</span>
          <span>Instructor: {instructor}</span>
          <span>Updated {lastUpdated}</span>
          <span>{language}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-sky-50 px-3 py-2 font-semibold text-sky-700">{category}</span>
          <span className="rounded-full bg-slate-100 px-3 py-2">{level}</span>
          <span className="rounded-full bg-slate-100 px-3 py-2">{duration}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">{tag}</span>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
        <img src={imageUrl} alt={title} className="h-56 w-full rounded-[20px] object-cover" loading="lazy" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Launch offer</p>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-semibold text-slate-900">${price}</span>
              <span className="text-lg text-slate-400 line-through">${oldPrice}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Enroll Now</button>
            <button className="rounded-full border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50">Start Learning</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <button className="rounded-full border border-slate-200 px-3 py-2 transition hover:bg-white">♡ Wishlist</button>
          <button className="rounded-full border border-slate-200 px-3 py-2 transition hover:bg-white">↗ Share</button>
        </div>
        <div className="rounded-[20px] border border-slate-200 bg-white p-4">
          <img src={thumbnailUrl} alt={`${title} preview`} className="h-24 w-full rounded-[16px] object-cover" loading="lazy" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
