const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cliente.controller');

router.get('/emprendedor/:id_emprendedor', ctrl.getByEmprendedor);
router.post('/', ctrl.createOrGet);

module.exports = router;
