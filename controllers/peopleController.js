const Person = require('../models/person');
const Group = require('../models/group');
// const Tag = require('../models/tag');
// const Items_Tags = require('../models/items_tags');

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

/************************************************/
/*************** Route Methods ******************/
/************************************************/

/* HOME PAGE */
exports.homePage = async (req, res, next) => {
    try {
        const peopleArray = await Person.aggregate([
            { $sample: { size: 20 } }
        ]);

        // res.json(peopleArray);
        res.render('index', { title: 'Home', peopleArray });
    } catch(error) {
        next(error);
    }
}

exports.listAllPeople = async (req, res, next) => {
    try {
        const peopleArray = await Person.aggregate([
            { $sort: { first_name: 1, acquaintance_level: -1 } }
        ]);

        // res.json(allPeople);
        res.render('index', { title: 'All people', peopleArray })
    } catch(error) {

    }
}

/* FILTER PAGES */
exports.menFilter = async (req, res, next) => {
    try {
        const filteredPeople = await Person.aggregate([
            { $match: { gender: 'male' } },
            { $sort: { first_name: 1, acquaintance_level: -1 } }
        ]);
        res.render('filter_page', { title: 'boys', header: 'male', filteredPeople });
    } catch(error) {
        next(error);
    }
}

exports.womenFilter = async (req, res, next) => {
    try {
        const filteredPeople = await Person.aggregate([
            { $match: { gender: 'female' } },
            { $sort: { first_name: 1, acquaintance_level: -1 } }
        ]);
        res.render('filter_page', { title: 'girls', header: 'female', filteredPeople });
    } catch(error) {
        next(error);
    }
}

exports.groups = async (req, res, next) => {
    try {
        const groups = await Group.aggregate([
            { $sort: { group_name: 1 } }
        ]);
        res.render('groups', { title: '{}', groups });
    } catch(error) {
        next(error);
    }
}

exports.addGroupPost = async (req, res, next) => {
    try {
        const group = new Group(req.body);
        group.group_people = [];

        await group.save();
        res.redirect('/groups');
    } catch(error) {
        next(error);
    }
}

exports.groupFilterGet = async (req, res, next) => {
    try {
        const groupId = req.params.groupId;
        const group = await Group.findOne({ _id: groupId });
        const filteredPeople = await Person.find({ _id: group.group_people });
        // const filteredPeople = await Group.aggregate([
        //     { $lookup: {
        //         from: 'people',
        //         localField: 'group_people',
        //         foreignField: '_id',
        //         as: 'people_data'
        //     } }
        // ]);

        res.render('filter_page', { title: group.group_name, filteredPeople, group });
    } catch(error) {
        next(error);
    }
}

exports.groupFilterPost = async (req, res, next) => {
    try {
        const groupId = req.params.groupId;
        const group = await Group.findByIdAndRemove({ _id: groupId });
        // Flash saying group.group_name has been deleted
        res.redirect('/groups');
    } catch(error) {
        next(error);
    }
}

exports.tagsFilter = async (req, res, next) => {
    try {
        let tags = await Person.distinct('tags');
        const emptyTagIndex = tags.findIndex(element => element === '');
        
        (emptyTagIndex == -1) ? '' : tags.splice(emptyTagIndex, 1);

        tags.sort();

        res.render('filter_page', { title: '@', tags });
    } catch(error) {
        next(error);
    }
}

exports.tagNameFilter = async(req, res, next) => {
    try {
        const tagName = req.params.tagName;
        const filteredPeople = await Person.aggregate([
            { $match: {tags: tagName } },
            { $sort: { association: 1 } },
            { $sort: { acquaintance_level: -1 } }
        ]);
        res.render('filter_page', { title: tagName, filteredPeople });
    } catch(error) {
        next(error);
    }
}

/* ADD PERSON */
exports.addPersonGet = (req, res) => {
    res.render('add_person', { title: 'Add Person' });
}

exports.addPersonPost = async (req, res, next) => {
    try {
        // res.json(req.body);
        const person = new Person(req.body);
        person.notes = [""];
        
        const inputTags = req.body.tags.replace(/\s/g, "").split(",");     
        person.tags = inputTags;
        // const tagArray = inputTags.map(item => {
        //     const tag = new Tag();
        //     tag.tag_name = item;
        //     return tag;
        // });

        await person.save();
        res.redirect('/add');
    } catch(error) {
        next(error);
    }
}

/* PERSON DETAILS */
exports.personDetailGet = async (req, res, next) => {
    try {
        const personParam = req.params.personId;
        const personData = await Person.findOne({ _id: personParam });
        const groupData = await Group.find({ group_people: personData._id });
        res.render('person_detail', { title: `${personData.first_name} ${personData.last_name}`, personData, groupData });
    } catch(error) {
        next(error);
    }
}

exports.personDetailPost = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const person = await Person.findOne({ _id: personId });
        let notesArray = person.notes;
        const dateString = getDateString();

        if(req.body.new_note != '') {
            if(person.notes[0] === "") {
                notesArray.unshift(`${dateString}${req.body.new_note}`);
                notesArray.pop();
            } else {
                notesArray.unshift(`${dateString}${req.body.new_note}`);
            }

            person.notes = notesArray;
            await Person.findByIdAndUpdate(personId, person, { new: true });
            
            // req.flash('success', `${hotel.hotel_name} updated successfully!`);
            res.redirect(`/all/${personId}`);
        } else {
            // req.flash('error', `error message`);
            res.redirect(`/all/${personId}`);
        }


    } catch(error) {
        next(error);
    }
}

exports.editTagsPost = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const person = await Person.findOne({ _id: personId });
        const tagUpdate = req.body.tags.replace(/\s/g, "").split(",");
        person.tags = tagUpdate;
        await Person.findByIdAndUpdate(personId, person, { new: true });
        res.redirect(`/all/${personId}`);
    } catch(error) {
        next(error);
    }
}

exports.editNoteGet = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const noteQuery = req.params.query;
        const personData = await Person.findOne({ _id: personId });
        const groupData = await Group.find({ group_people: personData._id });
        res.render('person_detail', { title: `${personData.first_name} ${personData.last_name}`, personData, groupData, noteQuery });
    } catch(error) {
        next(error);
    }
}

exports.editNotePost = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const noteQuery = req.params.query;
        const person = await Person.findOne({ _id: personId });
        const noteUpdate = person.notes[noteQuery].substring(0,10)+req.body.note;
        person.notes[noteQuery] = noteUpdate;
        await Person.findByIdAndUpdate(personId, person, { new: true });
        res.redirect(`/all/${personId}`);
    } catch(error) {
        next(error);
    }
}

exports.removeNoteGet = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const noteQuery = req.params.query;
        const personData = await Person.findOne({ _id: personId });
        const groupData = await Group.find({ group_people: personData._id });
        res.render('person_detail', {
            title: `${personData.first_name} ${personData.last_name}`,
            personData,
            groupData,
            noteQuery,
            remove: true
        });
    } catch(error) {
        next(error);
    }
}

exports.removeNotePost = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const noteQuery = req.params.query;
        const person = await Person.findOne({ _id: personId });
        person.notes.splice(noteQuery, 1);
        await Person.findByIdAndUpdate(personId, person, { new: true });
        res.redirect(`/all/${personId}`);
    } catch(error) {
        next(error);
    }
}

exports.editAcquaintancePost = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const person = await Person.findOne({ _id: personId });
        const newAcquaintanceLevel = req.body.acquaintancelevel[0];
        person.acquaintance_level = newAcquaintanceLevel;
        await Person.findByIdAndUpdate(personId, person, { new: true });
        res.redirect(`/all/${personId}`);
    } catch(error) {
        next(error);
    }
}

exports.editAssociationPost = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const person = await Person.findOne({ _id: personId });
        const newAssociation = req.body.association[0];
        person.association = newAssociation;
        await Person.findByIdAndUpdate(personId, person, { new: true });
        res.redirect(`/all/${personId}`);
    } catch(error) {
        next(error);
    }
}

exports.swapGender = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const person = await Person.findOne({ _id: personId });
        (person.gender === 'male') ? person.gender = 'female' : person.gender = 'male';
        await Person.findByIdAndUpdate(personId, person, { new: true });
        res.redirect(`/all/${personId}`);
        next();
    } catch(error) {
        next(error);
    }
}

exports.editNamePost = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const person = await Person.findOne({ _id: personId });
        person.first_name = req.body.firstName;
        person.last_name = req.body.lastName;
        person.age = req.body.age;
        await Person.findByIdAndUpdate(personId, person, { new: true });
        res.redirect(`/all/${personId}`);
    } catch(error) {
        next(error);
    }
}

exports.assignGroupPost = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const person = await Person.findOne({ _id: personId });
        const assignedGroup = req.body.group_name;
        const group = await Group.findOne({ group_name: { $eq: assignedGroup } });
        if(group == null) {
            res.redirect(`/all/${personId}`);
        } else {
            group.group_people.push(person._id);
        }
        await Group.findByIdAndUpdate(group._id, group, { new: true });
        res.redirect(`/all/${personId}`);
    } catch(error) {
        next(error);
    }
}

exports.removeGroupGet = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const groupQuery = req.params.group;
        const personData = await Person.findOne({ _id: personId });
        const groupData = await Group.find({ group_people: personData._id });
        res.render('person_detail', {
            title: `${personData.first_name} ${personData.last_name}`,
            personData,
            groupData,
            groupQuery
        });
    } catch(error) {
        next(error);
    }
}

exports.removeGroupPost = async (req, res, next) => {
    try {
        const personId = req.params.personId;
        const groupName = req.params.groupName;
        // const p = Person.findOne({ _id: personId });
        const group = await Group.findOne({ group_name: { $eq: groupName } });
        // const [person, group] = await Promise.all([p, g]);

        const stringPeople = group.group_people.map(item => String(item));
        let personIndex = -1;
        stringPeople.forEach((item, index) => {
            (item === personId) ? personIndex = index : personIndex+=0;
        });
        if(personIndex != -1){
            group.group_people.splice(personIndex, 1);
        } else {
            // Flash error
            res.redirect(`/all/${personId}`);
        }

        await Group.findByIdAndUpdate(group._id, group, { new: true });
        res.redirect(`/all/${personId}`);
    } catch(error) {
        next(error);
    }
}

// Did not add image edit ability as input returns array
// exports.editImagePost = async (req, res, next) => {
//     try {
//         const personId = req.params.personId;
//         const person = await Person.findOne({ _id: personId });
//         res.send(req.body.image);
//         // person.image = req.body.image;
//         res.json(person);

//         // await Person.findByIdAndUpdate(personId, person, { new: true });
//         // res.redirect(`/all/${personId}`);
//     } catch(error) {
//         next(error);
//     }
// }

/* Functions */
function getDateString() {
    const today = new Date();
    const date = [
        String(today.getDate()).length != 2 ? `0${String(today.getDate())}` : `${String(today.getDate())}`,
        String(today.getMonth()+1).length != 2 ? `0${String(today.getMonth()+1)}` : `${String(today.getMonth()+1)}`,
        String(today.getFullYear())
    ];
    let dateString = `${date[0]}/${date[1]}/${date[2]}`;
    return dateString;
}