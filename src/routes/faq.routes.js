const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/faq.controller');

router.get('/emprendedor/:id_emprendedor', ctrl.getByEmprendedor);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);

module.exports = router;
