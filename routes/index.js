var express = require('express');
var router = express.Router();

// Require Controllers
const indexController = require('../controllers/indexController');

/* GET home page. */
router.get('/', (req, res) => res.redirect('/all'));

router.get('/all', indexController.all);
router.get('/men', indexController.men);
router.get('/women', indexController.women);

module.exports = router;
