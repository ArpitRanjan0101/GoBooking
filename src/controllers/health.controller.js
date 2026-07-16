function getRoot(req, res) {
  res.status(200).json({
    success: true,
    message: 'BookEasy Backend Running',
  });
}

function getHealth(req, res) {
  res.status(200).json({
    status: 'ok',
  });
}

module.exports = { getRoot, getHealth };
