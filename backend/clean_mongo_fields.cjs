require('dotenv').config();
const mongoose = require('mongoose');

async function cleanMongo() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const collection = mongoose.connection.collection('courses');

  // Unset dead/unnecessary fields across all courses
  const unsetResult = await collection.updateMany({}, {
    $unset: {
      duration: '',
      lessons: '',
      certificate: '',
      students: '',
      totalReviews: '',
      language: ''
    }
  });

  console.log('Unset dead fields count:', unsetResult.modifiedCount);

  // Check if any courses have 'category' set instead of 'categoryName'
  const categoryFixes = await collection.updateMany(
    { category: { $exists: true }, categoryName: { $in: ['', null] } },
    [{ $set: { categoryName: '$category' } }, { $unset: ['category'] }]
  );
  console.log('Category normalization count:', categoryFixes.modifiedCount);

  // Remove dangling 'category' field if 'categoryName' already exists
  const removeDanglingCategory = await collection.updateMany(
    { category: { $exists: true } },
    { $unset: { category: '' } }
  );
  console.log('Dangling category removal count:', removeDanglingCategory.modifiedCount);

  const sample = await collection.findOne({});
  console.log('Sample course in MongoDB after clean:');
  console.log({
    title: sample.title,
    categoryName: sample.categoryName,
    packageType: sample.packageType,
    rating: sample.rating,
    hasStudents: 'students' in sample,
    hasLanguage: 'language' in sample,
    hasDuration: 'duration' in sample,
    hasCertificate: 'certificate' in sample
  });

  await mongoose.disconnect();
}

cleanMongo().catch(console.error);
