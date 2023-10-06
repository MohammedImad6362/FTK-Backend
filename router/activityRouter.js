const express = require('express')
const Joi = require('joi')
const Activity = require('../model/Activity')
const { authMiddleware, checkSuperAdmin, checkAdmin } = require('../middleware/authMiddleware');
const router = express.Router()

//Joi schema for activity
const activitySchema = Joi.object({
    name: Joi.string().required(),
    category_id: Joi.string().required(),
    thumbnail: Joi.string().required()
})

//Add activity
router.post('/add', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const { error } = activitySchema.validate(req.body)
        if (error) {
            res.status(400).send({ msg: "Validation error", errors: error.details.map(detail => detail.message) })
        }
        const { name, category_id, thumbnail } = req.body
        const existingActivity = await Activity.findOne({ name, category_id })
        if (existingActivity) {
            return res.status(409).send({ msg: "Activity already exists...!" })
        }

        const newActivity = new Activity({
            name,
            category_id,
            thumbnail,
        })
        await newActivity.save()
        res.status(200).send({ msg: "Activity added successfully...!", activity: newActivity })
    } catch (err) {
        res.status(500).send({ msg: "Adding activity failed", error: err.message })
    }
})

//Get all activities
router.get('/', authMiddleware, checkSuperAdmin, checkAdmin, async (req, res) => {
    try {
        const allActivities = await Activity.find()
        res.status(200).send(allActivities)
    } catch (err) {
        res.status(500).send({ msg: "Error fetching activities data", error: err.message })
    }
})

//Get single activity
router.get('/:id', authMiddleware, checkSuperAdmin, checkAdmin, async (req, res) => {
    try {
        const activity_id = req.params.id
        const activityData = await Activity.findById(activity_id)
        if (!activityData) {
            return res.status(400).send({ msg: "Activity not found with this id" })
        }
        res.status(200).send(activityData)
    } catch (err) {
        res.status(500).send({ msg: "Error fetching activity data", error: err.message })
    }
})

//Joi schema for activity
const updateAtivitySchema = Joi.object({
    name: Joi.string().required(),
    category_id: Joi.string().required(),
    thumbnail: Joi.string().required()
}).min(1)
//Update activity data
router.patch('/upd/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const activity_id = req.params.id
        const { error: updateError } = updateAtivitySchema.validate(req.body)
        if (updateError) {
            res.status(400).send({ msg: "Update validation error", errors: updateError.details.map(detail => detail.message) })
        }
        const updateActivityData = await Activity.findByIdAndUpdate(activity_id, req.body, { new: true })
        if (!updateActivityData) {
            return res.status(400).send({ msg: "Activity not found with this id" })
        }
        res.status(200).send({ msg: "Activity data updated successfully...!", updatedActivity: updateActivityData })
    } catch (err) {
        res.status(500).send({ msg: "Error updating activity data", error: err.message })
    }
})

//Delete activity
router.delete('/del/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const activity_id = req.params.id
        const deleteActivity = await Activity.findByIdAndDelete(activity_id)
        if (!deleteActivity) {
            return res.status(400).send({ msg: "Activity not found with this id" })
        }
        res.status(200).send({ msg: "Activity data deleted successfully...!", deletedActivity: deleteActivity })
    } catch (err) {
        res.status(500).send({ msg: "Error deleting activity", error: err.message })
    }
})

module.exports = router