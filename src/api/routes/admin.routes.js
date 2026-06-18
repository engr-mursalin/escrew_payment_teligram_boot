const express = require('express');
const auth = require('../middlewares/auth.middleware');

module.exports = (adminController) => {
  const router = express.Router();

  router.post('/login', (req, res) => adminController.login(req, res));

  router.get('/escrows', auth, (req, res) => adminController.listEscrows(req, res));
  router.get('/users', auth, (req, res) => adminController.listUsers(req, res));
  router.get('/disputes', auth, (req, res) => adminController.listDisputes(req, res));

  return router;
};

