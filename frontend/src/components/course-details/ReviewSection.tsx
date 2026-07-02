import React from 'react';

interface Review {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  date: string;
  review: string;
}

interface ReviewSectionProps {
  reviews: Review[];
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ reviews }) => {
  const average = (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1);
  const breakdown = [5, 4, 3, 2, 1].map((grade) => ({ grade, count: Math.max(1, 5 - grade) }));

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Student reviews</h2>
          <p className="mt-2 text-sm text-slate-500">What learners are saying about this course.</p>
        </div>
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Average rating</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-semibold text-slate-900">{average}</span>
            <span className="text-sm text-slate-500">/ 5</span>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.65fr_1fr]">
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Rating breakdown</h3>
          <div className="mt-4 space-y-3">
            {breakdown.map((item) => (
              <div key={item.grade} className="flex items-center gap-3 text-sm text-slate-600">
                <span className="w-8 font-semibold text-slate-700">{item.grade}★</span>
                <div className="h-2 flex-1 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-sky-600" style={{ width: `${item.count * 12}%` }} />
                </div>
                <span className="w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-[20px] border border-slate-200 p-4">
              <div className="flex items-start gap-4">
                <img src={review.avatar} alt={review.name} className="h-12 w-12 rounded-full object-cover" loading="lazy" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{review.name}</p>
                      <p className="text-sm text-slate-500">{review.role}</p>
                    </div>
                    <div className="text-sm text-slate-500">{review.date}</div>
                  </div>
                  <div className="mt-2 text-amber-500">{'★'.repeat(review.rating)}</div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{review.review}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
