module.exports = (req: any, res: any) => {
  res.status(200).json({ message: 'API funcionando!', time: new Date().toISOString() });
};
