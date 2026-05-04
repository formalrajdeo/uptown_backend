import path from 'path';
import express from 'express';
import multer from 'multer';

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `csv-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function fileFilter(req, file, cb) {
  const isCSV =
    path.extname(file.originalname).toLowerCase() === '.csv' &&
    (file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel');

  if (isCSV) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!'), false);
  }
}

const upload = multer({ storage, fileFilter });

router.post('/', (req, res) => {
  upload.single('file')(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

    res.status(200).send({
      message: 'CSV uploaded successfully',
      file: `/${req.file.path}`,
    });
  });
});

export default router;