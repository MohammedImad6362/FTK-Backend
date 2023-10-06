const express = require('express')
const Joi = require('joi')
const Category = require('../model/Category')
const Activity = require('../model/Activity')
const Video = require('../model/Video')
const { startSession } = require('mongoose')
const { authMiddleware, checkSuperAdmin, checkAdmin } = require('../middleware/authMiddleware')
const router = express.Router()

//Joi schema for category
const categorySchema = Joi.object({
    name: Joi.string().required(),
    thumbnail: Joi.string().required(),
    level_id: Joi.string().required()
})

//Add category
router.post('/add', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const { error } = categorySchema.validate(req.body)
        if (error) {
            res.status(400).send({ msg: "Validation errors", errors: error.details.map(detail => detail.message) })
        }
        const { name, thumbnail, level_id } = req.body
        const existingCategory = await Category.findOne({ name, level_id })
        if (existingCategory) {
            return res.status(409).send({ msg: "Category already exists...!" })
        }

        const newCategory = new Category({
            name,
            thumbnail,
            level_id
        })
        await newCategory.save()
        res.status(200).send({ msg: "Category added successfully...!", category: newCategory })
    } catch (err) {
        console.error(err);
        res.status(500).send({ msg: "Adding category failed", error: err.message })
    }
})

//Get all categories
router.get('/', authMiddleware, checkSuperAdmin, checkAdmin, async (req, res) => {
    try {
        const allCategories = await Category.find()
        res.status(200).send(allCategories)
    } catch (err) {
        console.log(err);
        res.status(500).send({ msg: "Error fetching categories data", error: err.message })
    }
})

//Get single category
router.get('/:id', authMiddleware, checkSuperAdmin, checkAdmin, async (req, res) => {
    try {
        const category_id = req.params.id
        const categoryData = await Category.findById(category_id)
        if (!categoryData) {
            return res.status(400).send({ msg: "Category not found with this id" })
        }
        res.status(200).send(categoryData)
    } catch (err) {
        res.status(500).send({ msg: "Error fetching category data", error: err.message })
    }
})

//Joi schema for category
const updateCategorySchema = Joi.object({
    name: Joi.string().required(),
    thumbnail: Joi.string().required(),
    level_id: Joi.string().required()
}).min(1)
//Update category data
router.patch('/upd/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const category_id = req.params.id
        const { error: updateError } = updateCategorySchema.validate(req.body)
        if (updateError) {
            res.status(400).send({ msg: "Update validation error", errors: updateError.details.map(detail => detail.message) })
        }
        const updateCategoryData = await Category.findByIdAndUpdate(category_id, req.body, { new: true })
        if (!updateCategoryData) {
            return res.status(400).send({ msg: "Category not found with this id" })
        }
        res.status(200).send({ msg: "Category data updated successfully...!", updatedCategory: updateCategoryData })
    } catch (err) {
        res.status(500).send({ msg: "Error updating category data", error: err.message })
    }
})

//Delete category
router.delete('/del/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {

        const session = await startSession()
        session.startTransaction()

        const category_id = req.params.id
        const deleteCategory = await Category.findByIdAndDelete(category_id)
        if (!deleteCategory) {
            return res.status(400).send({ msg: "Category not found with this id" })
        }
        const activities = await Activity.find({ category_id }, { _id: 1 }).session(session)
        const activityIds = await activities.map(activity => activity._id)

        const videos = await Video.find({ category_id }, { _id: 1 }).session(session)
        const videoIds = await videos.map(video => video._id)

        if (activityIds.length === 0 && videoIds.length === 0) {
            await Category.findByIdAndDelete(category_id).session(session);
        } else {
            await Activity.deleteMany({ category_id: { $in: activityIds } }).session(session);

            // Find all videos associated with the categories
            await Video.deleteMany({ category_id: { $in: videoIds } }).session(session);

            await Category.findByIdAndDelete(category_id).session(session);
        }

        await session.commitTransaction()
        session.endSession()

        res.status(200).send({ msg: "Category data deleted successfully...!", deletedCategory: deleteCategory })
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        res.status(500).send({ msg: "Error deleting category", error: err.message })
    }
})

module.exports = router