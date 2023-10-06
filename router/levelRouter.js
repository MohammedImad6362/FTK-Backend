const express = require('express');
const Joi = require('joi');
const Level = require('../model/Level');
const Batch = require('../model/Batch');
const Category = require('../model/Category');
const Activity = require('../model/Activity');
const Video = require('../model/Video');
const { authMiddleware, checkSuperAdmin, checkAdmin } = require('../middleware/authMiddleware');
const { startSession } = require('mongoose');
const router = express.Router();

//Joi schema for level
const levelSchema = Joi.object({
    name: Joi.string().required()
})

//Add level
router.post('/add', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const { error } = levelSchema.validate(req.body);
        if (error) {
            return res.status(400).send({ msg: "Validation error", error: error.details[0].message });
        }
        const { name } = req.body
        const existingLevel = await Level.findOne({ name })
        if (existingLevel) {
            return res.status(409).send({ msg: "Level already exists...!" })
        }

        const newLevel = new Level({
            name
        })
        await newLevel.save()
        res.status(200).send({ msg: "Level created successfully...!", level: newLevel })
    } catch (err) {
        res.status(500).send({ msg: "Adding level failed", error: err.message })
    }
})

//Get all levels
router.get('/', authMiddleware,checkSuperAdmin, checkAdmin, async (req, res) => {
    try {
        const allLevels = await Level.find()
        res.status(200).send(allLevels)
    } catch (err) {
        res.status(500).send({ msg: "Error fetching levels data", error: err.message })
    }
})

//Get single level
router.get('/:id', authMiddleware,checkSuperAdmin, checkAdmin, async (req, res) => {
    try {
        const level_id = req.params.id
        const levelData = await Level.findById(level_id)
        if (!levelData) {
            return res.status(400).send({ msg: "Level not found with this id" })
        }
        res.status(200).send(levelData)
    } catch (err) {
        res.status(500).send({ msg: "Error fetching level data", error: err.message })
    }
})

//Joi schema for update level data
const updateLevelSchema = Joi.object({
    name: Joi.string().required()
})
//Update level data
router.patch('/upd/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const level_id = req.params.id;
        const { error: updateError } = updateLevelSchema.validate(req.body);

        if (updateError) {
            return res.status(400).send({ msg: "Update validation error", error: updateError.details[0].message });
        }

        const updateLevelData = await Level.findByIdAndUpdate(level_id, req.body, { new: true });

        if (!updateLevelData) {
            return res.status(400).send({ msg: "Level not found with this id" });
        }

        res.status(200).send({ msg: "Level data updated successfully...!", updatedLevel: updateLevelData });
    } catch (err) {
        res.status(500).send({ msg: "Error updating level data", error: err.message });
    }
});


//Delete level
router.delete('/del/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    const session = await startSession();
    session.startTransaction();

    try {
        const level_id = req.params.id;

        // Find the level to be deleted and populate its related collections
        const levelToDelete = await Level.findById(level_id)

        if (!levelToDelete) {
            return res.status(400).send({ msg: "Level not found with this id" });
        }

        // Find all categories associated with this level
        const categories = await Category.find({ level_id }, { _id: 1 }).session(session);
        console.log(categories)
        const categoryIds = categories.map(category => category._id);

        if (categoryIds.length === 0) {
            // If categories are empty, delete the level and related collections
            await Level.findByIdAndDelete(level_id).session(session);
        } else {
            // Find all activities associated with the categories
            await Activity.deleteMany({ category_id: { $in: categoryIds } }).session(session);

            // Find all videos associated with the categories
            await Video.deleteMany({ category_id: { $in: categoryIds } }).session(session);

            // Delete all categories associated with the level
            await Category.deleteMany({ _id: { $in: categoryIds } }).session(session);

            // Delete all batches associated with the level
            await Batch.deleteMany({ level_id }).session(session);

            // Finally, delete the level itself
            await Level.findByIdAndDelete(level_id).session(session);
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).send({ msg: "Level and related collections deleted successfully...!" });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        res.status(500).send({ msg: "Error deleting level", error: err.message });
    }
});

module.exports = router