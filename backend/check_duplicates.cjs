const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const coursesCol = mongoose.connection.collection('courses');

  const allCourses = await coursesCol.find({}).toArray();
  console.log('Total courses in MongoDB:', allCourses.length);

  const boxCourses = allCourses.filter((c) =>
    c.packageType === 'business-in-the-box' ||
    /business in a box/i.test(c.title || '') ||
    /business-in-a-box/i.test(c.slug || '')
  );

  console.log('Duplicate business-in-a-box courses in MongoDB:', boxCourses.length);
  boxCourses.slice(0, 10).forEach((b) =>
    console.log(` - ID: ${b._id} | Title: "${b.title}" | Slug: "${b.slug}"`)
  );

  await mongoose.disconnect();
})();
