import React from 'react';

const InstructorSection = ({ instructor }) => {
  return (
    <section className="instructor-card">
      <div className="instructor-top">
        <img src={instructor.avatar} alt={instructor.name} />
        <div>
          <span className="info-pill">Instructor</span>
          <span className="info-pill">{instructor.experience}</span>
          <h2>{instructor.name}</h2>
          <p>{instructor.bio}</p>
        </div>
      </div>
      <div className="instructor-stats">
        <div>
          <span>Rating</span>
          <strong>{instructor.rating} ★</strong>
        </div>
        <div>
          <span>Students</span>
          <strong>{instructor.students}</strong>
        </div>
        <div>
          <span>Courses</span>
          <strong>{instructor.courses}</strong>
        </div>
      </div>
    </section>
  );
};

export default InstructorSection;
