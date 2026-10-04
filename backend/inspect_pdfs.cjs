const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const pdfsCol = mongoose.connection.collection('coursepdfs');
  const samplePdfs = await pdfsCol.find({}).limit(8).toArray();

  console.log('Sample PDF records in MongoDB:');
  samplePdfs.forEach((p) => {
    console.log({
      id: p._id,
      course: p.course,
      filename: p.filename,
      storageType: p.storageType,
      externalUrl: p.externalUrl ? p.externalUrl.slice(0, 60) + '...' : null,
      fileSize: p.fileSize,
      hasDataBuffer: Boolean(p.data),
    });
  });

  const total = await pdfsCol.countDocuments({});
  console.log('\nTotal PDFs in MongoDB:', total);

  await mongoose.disconnect();
})();
