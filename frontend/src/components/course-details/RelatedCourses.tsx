import React from 'react';

interface RelatedCourse {
  id: string;
  title: string;
  slug: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
  rating: number;
}

interface RelatedCoursesProps {
  relatedCourses: RelatedCourse[];
}

const RelatedCourses: React.FC<RelatedCoursesProps> = ({ relatedCourses }) => {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] lg:p-8">
      <h2 className="text-2xl font-semibold text-slate-900">Related courses</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {relatedCourses.map((course) => (
          <article key={course.id} className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50 transition hover:-translate-y-1 hover:shadow-lg">
            <img src={course.imageUrl} alt={course.title} className="h-36 w-full object-cover" loading="lazy" />
            <div className="p-4">
              <h3 className="text-base font-semibold text-slate-900">{course.title}</h3>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-1 text-amber-500">★ {course.rating.toFixed(1)}</div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">${course.price}</span>
                  {course.oldPrice && <span className="text-slate-400 line-through">${course.oldPrice}</span>}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default RelatedCourses;
