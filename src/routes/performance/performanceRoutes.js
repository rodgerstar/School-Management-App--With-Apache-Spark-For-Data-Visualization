const express = require('express');
const router = express.Router();
const Performance = require('../../models/performance');
const Student = require('../../models/student');
const { checkPermission } = require('../../middleware/permissionCheck');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Add performance (Dean/Teacher)
router.post('/', checkPermission('performance', 'canAdd'), asyncHandler(async (req, res) => {
  const { studentId, classId, term, year, subject, score, grade, remarks } = req.body;

  const performance = new Performance({
    studentId,
    classId,
    term,
    year,
    subject,
    score,
    grade,
    remarks
  });
  await performance.save();

  const populated = await Performance.findById(performance._id)
    .populate('studentId', 'name admissionNumber')
    .populate('classId', 'name');

  res.status(201).json({ message: 'Performance added', performance: populated });
}));

// Get class ranking (students, parents, teachers, dean)
router.get('/ranking/:classId', checkPermission('performance', 'canView'), asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { term, year } = req.query;

  if (!term || !year) {
    return res.status(400).json({ error: 'term and year required' });
  }

  const performances = await Performance.find({ classId, term, year });

  // Group by student and calculate average
  const rankingMap = {};

  performances.forEach(p => {
    const sid = p.studentId.toString();
    if (!rankingMap[sid]) {
      rankingMap[sid] = { total: 0, count: 0, subjects: [] };
    }
    rankingMap[sid].total += p.score;
    rankingMap[sid].count += 1;
    rankingMap[sid].subjects.push({ subject: p.subject, score: p.score });
  });

  // Build ranking
  const ranking = Object.keys(rankingMap).map(sid => ({
    studentId: sid,
    average: (rankingMap[sid].total / rankingMap[sid].count).toFixed(2),
    subjects: rankingMap[sid].subjects
  })).sort((a, b) => b.average - a.average);

  // Add rank
  ranking.forEach((item, index) => item.rank = index + 1);

  // Populate student names
  const studentIds = ranking.map(r => r.studentId);
  const students = await Student.find({ _id: { $in: studentIds } })
    .select('name admissionNumber');

  const finalRanking = ranking.map(r => {
    const student = students.find(s => s._id.toString() === r.studentId);
    return {
      rank: r.rank,
      name: student?.name || 'Unknown',
      admissionNumber: student?.admissionNumber,
      average: r.average,
      subjects: r.subjects
    };
  });

  res.json({ classId, term, year, ranking: finalRanking });
}));

module.exports = router;