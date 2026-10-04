const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const coursesCol = mongoose.connection.collection('courses');
  const enrollmentsCol = mongoose.connection.collection('enrollments');
  const pdfsCol = mongoose.connection.collection('coursepdfs');

  const allCourses = await coursesCol.find({}).toArray();
  const boxCourses = allCourses.filter((c) =>
    c.packageType === 'business-in-the-box' ||
    /business in a box/i.test(c.title || '') ||
    /business-in-a-box/i.test(c.slug || '')
  );

  const boxIds = boxCourses.map((b) => b._id);
  const enrollmentsOnBox = await enrollmentsCol.find({ course: { $in: boxIds } }).toArray();
  const pdfsOnBox = await pdfsCol.find({ course: { $in: boxIds } }).toArray();

  console.log(`Checking 38 duplicate courses:`);
  console.log(` - Any enrollments referencing them: ${enrollmentsOnBox.length}`);
  console.log(` - Any PDFs referencing them: ${pdfsOnBox.length}`);

  await mongoose.disconnect();
})();
