import React from 'react';

const ReviewSection = ({ reviews, rating }) => {
  return (
    <section className="review-section rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Student reviews</h2>
          <p className="mt-2 text-sm text-slate-500">What learners are saying about this course.</p>
        </div>
        <div className="rounded-3xl bg-slate-50 px-4 py-3 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Average rating</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{rating}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {reviews.map((review) => (
          <article key={review.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition duration-300 hover:border-slate-300 hover:bg-white">
            <div className="flex items-center gap-4">
              <img className="h-12 w-12 rounded-full object-cover" src={review.avatar} alt={review.name} />
              <div>
                <p className="font-semibold text-slate-900">{review.name}</p>
                <p className="text-sm text-slate-500">{review.date}</p>
              </div>
              <span className="ml-auto rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">{review.rating} ★</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{review.title}</h3>
            <p className="mt-2 text-slate-600">{review.comment}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ReviewSection;
