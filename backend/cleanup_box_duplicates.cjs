const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const coursesCol = mongoose.connection.collection('courses');

    const totalBefore = await coursesCol.countDocuments({});
    console.log(`Total courses before cleanup: ${totalBefore}`);

    const filter = {
      $or: [
        { packageType: 'business-in-the-box' },
        { slug: { $regex: /-business-in-a-box$/i } },
        { title: { $regex: /\s*-\s*Business in a Box$/i } },
      ],
    };

    const duplicateCourses = await coursesCol.find(filter).toArray();
    console.log(`Found ${duplicateCourses.length} duplicate Business in a Box courses to remove.`);

    if (duplicateCourses.length > 0) {
      const deleteResult = await coursesCol.deleteMany(filter);
      console.log(`Deleted ${deleteResult.deletedCount} duplicate courses from MongoDB.`);
    }

    const totalAfter = await coursesCol.countDocuments({});
    console.log(`Total courses remaining in MongoDB: ${totalAfter}`);

    const planCount = await coursesCol.countDocuments({ packageType: 'business-plans' });
    const toolCount = await coursesCol.countDocuments({ packageType: 'business-tools' });
    const boxCount = await coursesCol.countDocuments({ packageType: 'business-in-the-box' });

    console.log('\nUpdated MongoDB Counts:');
    console.log(`- Business Plans:    ${planCount}`);
    console.log(`- Business Tools:    ${toolCount}`);
    console.log(`- Business in a Box: ${boxCount}`);
    console.log(`- Total Courses:     ${totalAfter}`);

    await mongoose.disconnect();
    console.log('\nMongoDB connection closed. Cleanup complete.');
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
})();
