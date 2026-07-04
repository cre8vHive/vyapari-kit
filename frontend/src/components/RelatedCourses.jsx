import React from 'react';

const RelatedCourses = ({ courses }) => {
  return (
    <section className="related-courses rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300">
      <h2 className="text-2xl font-semibold text-slate-900">Related courses</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {courses.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 transition duration-300 hover:shadow-lg">
            <img className="h-40 w-full object-cover" src={item.imageUrl} alt={item.title} />
            <div className="p-4">
              <p className="text-sm font-semibold text-slate-700">{item.category}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm font-semibold text-slate-900">{item.price}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RelatedCourses;
