// Require models
const Person = require('../models/person');

/************************************************/
/**************** Cloudinary ********************/
/************************************************/

const Cloudinary = require('cloudinary');
const Multer = require('multer');
const { ReplSet } = require('mongodb');

// Set up Cloudinary
Cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up Multer
const storage = Multer.diskStorage({}); // Tells multer no disk storage will be required, therefore no path, empty obj
const upload = Multer({ storage }); // Passes storage onto Multer and saves in upload const
exports.upload = upload.single('image');    // Tells multer to only handle single-file uploads

exports.pushToCloudinary = (req, res, next) => {
    if(req.file) {

        if(res.locals.url === '/groups/add') {
            Cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'peopleManagement/groups'
            })
            .then((result) => {
                req.body.image = result.public_id;
                next();
            })
            .catch(() => {
                // req.flash('error', 'Sorry, there was a problem uploading your image. Please try again');
                res.redirect('/groups/add');
            });

        } else {
            Cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'peopleManagement'
            })
            .then((result) => {
                req.body.image = result.public_id;
                next();
            })
            .catch(() => {
                // req.flash('error', 'Sorry, there was a problem uploading your image. Please try again');
                res.redirect('/add');
            });
        }
    } else {
        next();
    }
}

function paginate(people) {
	const totalPages = people.length % 10 != 0
            ? people.length / 10 - people.length % 10 / 10 + 1
            : people.length / 10 - people.length % 10 / 10;
        
        const pages = [];
        for (let i = 0; i < totalPages; i++) { pages.push([]); }
        
        for (let pageCount = 0; pageCount < totalPages; pageCount++){
            let peoplePerPage = (pageCount + 1) * 10;
            if (pageCount == totalPages - 1) {
                if (people.length % 10 != 0) peoplePerPage = peoplePerPage - 10 + people.length % 10;
            }

            for (let i = pageCount * 10; i < peoplePerPage; i++) {
                pages[pageCount].push(people[i]);
            }
        }
	return pages;
};

exports.all = async (req, res, next) => {
    try {
        // const people = await Person.paginate({}, { sort: { first_name: 1 }, page:1, limit:10}).then(res => res);
        // // console.log(people)
        // // res.json(people)
        // res.render('index', { title: 'People: All', people: people.docs, page: people.page, pages: people.totalPages })
        const people = await Person.aggregate([{$sort:{first_name:1}}]);
        const pages = paginate(people);
        res.render('index', { title: 'People: All', pages })
    } catch (error) {
        next(error);
    }
};

exports.men = async (req, res, next) => {
	try {
		const people = await Person.aggregate([
			{ $match: { gender: 'male' } },
			{ $sort: { first_name: 1 } }
		]);
		const pages = paginate(people);
		res.render('index', { title: 'People: Men', pages });
	} catch (error) {
		next(error);
	}
};

exports.women = async (req, res, next) => {
    try {
        const people = await Person.aggregate([
            { $match: { gender: 'female' } },
            { $sort: { first_name: 1 } }
        ]);
        const pages = paginate(people);
        res.render('index', { title: 'People: Women', pages });
    } catch (error) {
        next(error);
    }
};