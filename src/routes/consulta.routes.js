const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/consulta.controller');

router.get('/emprendedor/:id_emprendedor', ctrl.getByEmprendedor);
router.post('/', ctrl.create);
router.put('/:id/estado', ctrl.updateEstado);

module.exports = router;
